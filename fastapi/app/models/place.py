"""SQLAlchemy ORM model for the places table."""

from sqlalchemy import Column, Integer, String, Float

from app.database import Base


class Place(Base):
    """Represents a culinary place / business in Batam."""

    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    rating = Column(Float, nullable=True)
    review = Column(Integer, nullable=True)
    price_level = Column(Integer, nullable=True)
    category = Column(String, nullable=True, index=True)
    services = Column(String, nullable=True)
    address = Column(String, nullable=True)
    open_hours = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)
    url = Column(String, nullable=True)
    cluster = Column(String, nullable=True, server_default="'0'")

    def __repr__(self) -> str:
        return f"<Place(id={self.id}, name='{self.name}')>"
