from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='../frontend', static_url_path='')
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'your_jwt_secret_here')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'your_jwt_secret_here')
app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/smarthelmet')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")
mongo = PyMongo(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Database collections
db = mongo.db

# Web application routes will be added here

# Serve frontend
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    # Import routes here to avoid circular imports
    from routes import auth_routes, api_routes, admin_routes, analytics_routes
    
    # Register blueprints
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(api_routes.bp)
    app.register_blueprint(admin_routes.bp)
    app.register_blueprint(analytics_routes.bp)
    
    # Start the server
    print("Starting Flask server...")
    app.run(host='0.0.0.0', port=5001, debug=True)
