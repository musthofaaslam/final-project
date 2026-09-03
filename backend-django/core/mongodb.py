# Contoh cara koneksi via pymongo
from pymongo import MongoClient

# Host memakai nama service 'mongodb'
MONGO_URI = "mongodb://admin:ahniaosyv@mongodb:27017/"
mongo_client = MongoClient(MONGO_URI)
mongo_db = mongo_client['local_final_mongodb']