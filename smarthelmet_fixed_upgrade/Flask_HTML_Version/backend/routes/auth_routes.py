from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from flask_bcrypt import generate_password_hash, check_password_hash
from datetime import datetime
from bson import ObjectId
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db, bcrypt

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    try:
        print("Registration attempt started")  # Debug log
        
        # Get request data
        data = request.get_json()
        print(f"Received registration data: {data}")  # Debug log
        
        # Validate required fields
        required_fields = ['username', 'password']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            print(error_msg)  # Debug log
            return jsonify({'error': 'missing', 'message': error_msg}), 400
        
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'rider')
        email = data.get('email', '')
        phone = data.get('phone', '')
        
        print(f"Checking if user '{username}' exists...")  # Debug log
        
        # Check if user exists
        try:
            existing_user = db.users.find_one({'username': username})
            if existing_user:
                error_msg = f"Username '{username}' already exists"
                print(error_msg)  # Debug log
                return jsonify({'error': 'exists', 'message': error_msg}), 400
        except Exception as db_error:
            error_msg = f"Database error while checking user existence: {str(db_error)}"
            print(error_msg)  # Debug log
            return jsonify({'error': 'database', 'message': error_msg}), 500
        
        try:
            # Hash password
            print("Hashing password...")  # Debug log
            password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
            
            # Create user document
            user_doc = {
                'username': username,
                'passwordHash': password_hash,
                'role': role,
                'email': email,
                'phone': phone,
                'isActive': True,
                'createdAt': datetime.utcnow()
            }
            
            print(f"Creating user: {user_doc}")  # Debug log
            
            # Insert user into database
            result = db.users.insert_one(user_doc)
            
            print(f"User created successfully with ID: {result.inserted_id}")  # Debug log
            
            return jsonify({
                'ok': True,
                'user': {
                    'id': str(result.inserted_id),
                    'username': username
                },
                'message': 'Registration successful!'
            }), 201
            
        except Exception as user_creation_error:
            error_msg = f"Error creating user: {str(user_creation_error)}"
            print(error_msg)  # Debug log
            return jsonify({
                'error': 'creation_failed',
                'message': error_msg
            }), 500
        
    except Exception as e:
        error_msg = f"Unexpected error during registration: {str(e)}"
        print(error_msg)  # Debug log
        return jsonify({
            'error': 'server_error',
            'message': error_msg
        }), 500

@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'missing'}), 400
        
        # Find user
        user = db.users.find_one({'username': username})
        if not user:
            return jsonify({'error': 'invalid'}), 401
        
        # Check password
        if not bcrypt.check_password_hash(user['passwordHash'], password):
            return jsonify({'error': 'invalid'}), 401
        
        # Create access token
        access_token = create_access_token(
            identity=str(user['_id']),
            additional_claims={'role': user.get('role', 'rider')}
        )
        
        return jsonify({
            'ok': True,
            'token': access_token,
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'role': user.get('role', 'rider')
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'server'}), 500
