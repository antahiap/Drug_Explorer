import os
SERVER_ROOT = os.path.dirname(os.path.abspath(__file__))


class Config(object):
    MODEL_FOLDER = os.path.join(SERVER_ROOT, 'collab_delivery/')
    FRONT_ROOT = os.path.join(SERVER_ROOT, 'build')
    DATA_FOLDER = os.path.join(SERVER_ROOT, 'data')
    STATIC_FOLDER = os.path.join(SERVER_ROOT, 'build/static')


class ProductionConfig(Config):
    pass


class DevelopmentConfig(Config):
    pass


class TestingConfig(Config):
    pass
