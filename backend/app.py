from flask import Flask, request, jsonify
from flask_cors import CORS  # Enable CORS
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
DATABASE = 'database/gestao_horarios.db'

# Função para conectar ao banco de dados
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Rota para criar conta
@app.route('/register', methods=['POST'])  # Change method to POST
def register():
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')

    if not nome or not email or not senha:
        return jsonify({'error': 'Dados incompletos'}), 400

    # Criptografa a senha
    senha_hash = generate_password_hash(senha)

    conn = get_db_connection()
    try:
        conn.execute(
            'INSERT INTO Usuario (nome, email, senha, tipo, ativo) VALUES (?, ?, ?, ?, ?)',
            (nome, email, senha_hash, 'aluno', 1)  # Padrão: tipo 'aluno' e ativo '1'
        )
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email já cadastrado'}), 400
    finally:
        conn.close()

    return jsonify({'message': 'Conta criada com sucesso!'}), 201

if __name__ == '__main__':
    app.run(debug=True)