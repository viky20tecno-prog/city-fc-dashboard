#!/bin/bash

# Test script para /api/inscripcion
# Usa este script para probar el endpoint antes de hacer deploy

BASE_URL="${1:-http://localhost:3000}"
echo "Testing API endpoint: $BASE_URL/api/inscripcion"
echo ""

# Datos de prueba
curl -X POST "$BASE_URL/api/inscripcion" \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "1234567890",
    "nombre": "TestName",
    "apellidos": "TestLast",
    "tipo_id": "Cedula de Ciudadania",
    "celular": "3001234567",
    "correo_electronico": "test@example.com",
    "lugar_de_nacimiento": "Bogota",
    "fecha_nacimiento": "2000-01-15",
    "tipo_sangre": "O+",
    "eps": "Sura",
    "municipio": "Medellin",
    "familiar_emergencia": "Juan Perez",
    "celular_contacto": "3109876543"
  }' | jq .

echo ""
echo "✅ Si ves {'success': true, ...}, el endpoint funciona!"
echo ""
