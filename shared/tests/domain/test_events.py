import uuid

import pytest

from tumaini_shared.domain.events import DomainEvent, InMemoryEventBus


# ---------------------------------------------------------------------------
# DomainEvent
# ---------------------------------------------------------------------------

class TestDomainEvent:
    def test_auto_generates_event_id(self) -> None:
        e = DomainEvent(event_name="x.happened", aggregate_id=uuid.uuid4())
        assert isinstance(e.event_id, uuid.UUID)

    def test_auto_generates_timestamp(self) -> None:
        e = DomainEvent(event_name="x.happened", aggregate_id=uuid.uuid4())
        assert e.timestamp is not None

    def test_namespaced_event_name(self) -> None:
        e = DomainEvent(event_name="identity.user_registered", aggregate_id=uuid.uuid4())
        assert e.event_name == "identity.user_registered"

    def test_json_round_trip_preserves_all_fields(self) -> None:
        agg_id = uuid.uuid4()
        original = DomainEvent(
            event_name="cv.uploaded",
            aggregate_id=agg_id,
            data={"file_url": "s3://bucket/cv.pdf"},
        )
        restored = DomainEvent.from_json(original.to_json())
        assert restored.event_name == original.event_name
        assert restored.aggregate_id == original.aggregate_id
        assert restored.data == original.data
        assert restored.event_id == original.event_id

    def test_immutable_after_creation(self) -> None:
        e = DomainEvent(event_name="x", aggregate_id=uuid.uuid4())
        with pytest.raises(Exception):
            e.event_name = "mutated"  # type: ignore[misc]


# ---------------------------------------------------------------------------
# InMemoryEventBus
# ---------------------------------------------------------------------------

class TestInMemoryEventBus:
    @pytest.mark.asyncio
    async def test_async_handler_is_called(self) -> None:
        bus = InMemoryEventBus()
        received: list[DomainEvent] = []

        async def handler(event: DomainEvent) -> None:
            received.append(event)

        await bus.subscribe("test.happened", handler)
        event = DomainEvent(event_name="test.happened", aggregate_id=uuid.uuid4())
        await bus.publish(event)

        assert len(received) == 1
        assert received[0] is event

    @pytest.mark.asyncio
    async def test_sync_handler_is_called(self) -> None:
        bus = InMemoryEventBus()
        received: list[DomainEvent] = []

        def handler(event: DomainEvent) -> None:
            received.append(event)

        await bus.subscribe("test.sync", handler)
        event = DomainEvent(event_name="test.sync", aggregate_id=uuid.uuid4())
        await bus.publish(event)

        assert len(received) == 1

    @pytest.mark.asyncio
    async def test_publish_with_no_subscribers_does_not_raise(self) -> None:
        bus = InMemoryEventBus()
        event = DomainEvent(event_name="unhandled.event", aggregate_id=uuid.uuid4())
        await bus.publish(event)  # must not raise

    @pytest.mark.asyncio
    async def test_multiple_subscribers_all_called(self) -> None:
        bus = InMemoryEventBus()
        calls: list[str] = []

        await bus.subscribe("x.happened", lambda e: calls.append("first"))
        await bus.subscribe("x.happened", lambda e: calls.append("second"))

        await bus.publish(DomainEvent(event_name="x.happened", aggregate_id=uuid.uuid4()))
        assert calls == ["first", "second"]

    @pytest.mark.asyncio
    async def test_subscriber_only_receives_its_event(self) -> None:
        bus = InMemoryEventBus()
        received: list[DomainEvent] = []

        await bus.subscribe("a.happened", lambda e: received.append(e))
        await bus.publish(DomainEvent(event_name="b.happened", aggregate_id=uuid.uuid4()))

        assert received == []
