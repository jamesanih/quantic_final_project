from __future__ import annotations

import asyncio
import logging
from typing import Callable, Optional

import aio_pika
import aio_pika.abc

from tumaini_shared.domain.events import DomainEvent, EventBus

logger = logging.getLogger(__name__)

EXCHANGE_NAME = "domain_events"
DEAD_LETTER_EXCHANGE = "dlx.domain_events"
MAX_RETRIES = 3
# Exponential backoff delays in seconds: attempt 1→1s, 2→2s, 3→4s
_RETRY_DELAYS = [1, 2, 4]


class RabbitMQEventBus(EventBus):
    """
    RabbitMQ-backed event bus.

    - Topic exchange for flexible routing (event_name is the routing key).
    - Durable queues + persistent messages survive broker restarts.
    - Dead-letter queue (DLQ) captures messages that exhaust all retries.
    - Queue naming: ``{service_name}.{event_name}``
    - DLQ naming:   ``{service_name}.{event_name}.dlq``
    """

    def __init__(self, amqp_url: str, service_name: str) -> None:
        self._amqp_url = amqp_url
        self._service_name = service_name
        self._connection: Optional[aio_pika.abc.AbstractRobustConnection] = None
        self._channel: Optional[aio_pika.abc.AbstractChannel] = None
        self._exchange: Optional[aio_pika.abc.AbstractExchange] = None
        self._dlx: Optional[aio_pika.abc.AbstractExchange] = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(self) -> None:
        """Open a robust connection (auto-reconnects on network blips)."""
        self._connection = await aio_pika.connect_robust(self._amqp_url)
        self._channel = await self._connection.channel()
        await self._channel.set_qos(prefetch_count=10)

        self._dlx = await self._channel.declare_exchange(
            DEAD_LETTER_EXCHANGE,
            aio_pika.ExchangeType.TOPIC,
            durable=True,
        )
        self._exchange = await self._channel.declare_exchange(
            EXCHANGE_NAME,
            aio_pika.ExchangeType.TOPIC,
            durable=True,
        )
        logger.info("[%s] Connected to RabbitMQ: %s", self._service_name, self._amqp_url)

    async def disconnect(self) -> None:
        if self._connection and not self._connection.is_closed:
            await self._connection.close()
            logger.info("[%s] Disconnected from RabbitMQ", self._service_name)

    # ------------------------------------------------------------------
    # EventBus interface
    # ------------------------------------------------------------------

    async def publish(self, event: DomainEvent) -> None:
        if not self._exchange:
            raise RuntimeError("Call connect() before publish().")

        body = event.to_json().encode()
        message = aio_pika.Message(
            body=body,
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            headers={"event_name": event.event_name, "retry_count": 0},
        )
        routing_key = _to_routing_key(event.event_name)
        await self._exchange.publish(message, routing_key=routing_key)
        logger.debug(
            "[%s] Published %s (id=%s)", self._service_name, event.event_name, event.event_id
        )

    async def subscribe(self, event_name: str, handler: Callable) -> None:
        """
        Declare a durable queue bound to the main exchange and begin consuming.
        Failed messages are retried up to MAX_RETRIES times before routing to the DLQ.
        """
        if not self._channel or not self._exchange or not self._dlx:
            raise RuntimeError("Call connect() before subscribe().")

        routing_key = _to_routing_key(event_name)
        queue_name = f"{self._service_name}.{event_name}"
        dlq_name = f"{queue_name}.dlq"

        # Dead-letter queue — receives messages after all retries are exhausted
        dlq = await self._channel.declare_queue(dlq_name, durable=True)
        await dlq.bind(self._dlx, routing_key=routing_key)

        # Main queue — routes failures to DLX automatically
        queue = await self._channel.declare_queue(
            queue_name,
            durable=True,
            arguments={
                "x-dead-letter-exchange": DEAD_LETTER_EXCHANGE,
                "x-dead-letter-routing-key": routing_key,
            },
        )
        await queue.bind(self._exchange, routing_key=routing_key)

        async def _on_message(msg: aio_pika.abc.AbstractIncomingMessage) -> None:
            retry_count = int(msg.headers.get("retry_count", 0))
            try:
                event = DomainEvent.from_json(msg.body.decode())
                if asyncio.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
                await msg.ack()
            except Exception as exc:
                attempt = retry_count + 1
                logger.warning(
                    "[%s] Handler failed for '%s' (attempt %d/%d): %s",
                    self._service_name, event_name, attempt, MAX_RETRIES, exc,
                )
                if retry_count < MAX_RETRIES - 1:
                    delay = _RETRY_DELAYS[min(retry_count, len(_RETRY_DELAYS) - 1)]
                    await asyncio.sleep(delay)
                    await msg.nack(requeue=True)
                else:
                    logger.error(
                        "[%s] Max retries reached for '%s'. Routing to DLQ.",
                        self._service_name, event_name,
                    )
                    await msg.nack(requeue=False)

        await queue.consume(_on_message)
        logger.info("[%s] Subscribed to '%s' via queue '%s'", self._service_name, event_name, queue_name)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_routing_key(event_name: str) -> str:
    """Convert dot-notation event name to RabbitMQ topic routing key."""
    return event_name.replace(".", "_")
