CONNECTOR_REGISTRY = {}

def register_connector(cls):
    CONNECTOR_REGISTRY[cls.slug] = cls
    return cls
