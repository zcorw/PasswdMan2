from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


ClientAuditAction = Literal[
    "password.primary.viewed",
    "password.primary.copied",
    "password.secondary.viewed",
    "password.secondary.copied",
    "import.opened",
    "export.opened",
]


class AuditEventPayload(BaseModel):
    action: ClientAuditAction
    resource_type: str | None = Field(default=None, alias="resourceType", max_length=80)
    resource_id: str | None = Field(default=None, alias="resourceId", max_length=128)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("metadata")
    @classmethod
    def validate_metadata(cls, value: dict[str, Any]) -> dict[str, Any]:
        if len(value) > 20:
            raise ValueError("metadata has too many fields")
        return value
