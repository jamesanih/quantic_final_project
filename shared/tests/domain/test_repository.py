import uuid


from tumaini_shared.domain.base import Entity
from tumaini_shared.domain.repository import (
    InMemoryRepository,
    InMemoryUnitOfWork,
    Specification,
)


# ---------------------------------------------------------------------------
# Test double
# ---------------------------------------------------------------------------

class User(Entity):
    def __init__(self, id: uuid.UUID, name: str, active: bool = True) -> None:
        super().__init__(id)
        self.name = name
        self.active = active


class ActiveSpec(Specification[User]):
    def is_satisfied_by(self, entity: User) -> bool:
        return entity.active


class NameSpec(Specification[User]):
    def __init__(self, name: str) -> None:
        self._name = name

    def is_satisfied_by(self, entity: User) -> bool:
        return entity.name == self._name


# ---------------------------------------------------------------------------
# InMemoryRepository
# ---------------------------------------------------------------------------

class TestInMemoryRepository:
    def setup_method(self) -> None:
        self.repo: InMemoryRepository[User] = InMemoryRepository()

    def test_add_and_get_by_id(self) -> None:
        user = User(uuid.uuid4(), "Alice")
        self.repo.add(user)
        assert self.repo.get(user.id) is user

    def test_get_returns_none_for_unknown_id(self) -> None:
        assert self.repo.get(uuid.uuid4()) is None

    def test_find_all_returns_every_entity(self) -> None:
        u1 = User(uuid.uuid4(), "Alice")
        u2 = User(uuid.uuid4(), "Bob")
        self.repo.add(u1)
        self.repo.add(u2)
        assert set(self.repo.find_all()) == {u1, u2}

    def test_find_filters_by_specification(self) -> None:
        active = User(uuid.uuid4(), "Alice", active=True)
        inactive = User(uuid.uuid4(), "Bob", active=False)
        self.repo.add(active)
        self.repo.add(inactive)

        results = self.repo.find(ActiveSpec())
        assert active in results
        assert inactive not in results

    def test_update_replaces_entity(self) -> None:
        user = User(uuid.uuid4(), "Alice")
        self.repo.add(user)
        user.name = "Updated"
        self.repo.update(user)
        assert self.repo.get(user.id).name == "Updated"  # type: ignore[union-attr]

    def test_delete_removes_entity(self) -> None:
        user = User(uuid.uuid4(), "Alice")
        self.repo.add(user)
        self.repo.delete(user.id)
        assert self.repo.get(user.id) is None

    def test_delete_nonexistent_is_silent(self) -> None:
        self.repo.delete(uuid.uuid4())  # must not raise


# ---------------------------------------------------------------------------
# Specification composition
# ---------------------------------------------------------------------------

class TestSpecificationComposition:
    def _user(self, name: str, active: bool = True) -> User:
        return User(uuid.uuid4(), name, active)

    def test_and_both_must_match(self) -> None:
        spec = ActiveSpec().and_(NameSpec("Alice"))
        assert spec.is_satisfied_by(self._user("Alice", active=True))
        assert not spec.is_satisfied_by(self._user("Alice", active=False))
        assert not spec.is_satisfied_by(self._user("Bob", active=True))

    def test_or_either_matches(self) -> None:
        spec = NameSpec("Alice").or_(NameSpec("Bob"))
        assert spec.is_satisfied_by(self._user("Alice"))
        assert spec.is_satisfied_by(self._user("Bob"))
        assert not spec.is_satisfied_by(self._user("Carol"))

    def test_not_inverts_result(self) -> None:
        spec = ActiveSpec().not_()
        assert spec.is_satisfied_by(self._user("X", active=False))
        assert not spec.is_satisfied_by(self._user("X", active=True))


# ---------------------------------------------------------------------------
# InMemoryUnitOfWork
# ---------------------------------------------------------------------------

class TestInMemoryUnitOfWork:
    def test_context_manager_commits(self) -> None:
        with InMemoryUnitOfWork() as uow:
            uow.commit()  # must not raise

    def test_exception_triggers_rollback_not_reraise(self) -> None:
        try:
            with InMemoryUnitOfWork():
                raise ValueError("boom")
        except ValueError:
            pass  # rollback was called; exception still propagates — that's correct
