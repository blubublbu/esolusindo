<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$pdo = new PDO("mysql:host=localhost;dbname=perpustakaan", "root", "");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $stmt = $pdo->query("SELECT id, nama, email FROM users ORDER BY nama");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO users (nama, email) VALUES (?, ?)");
    $stmt->execute([$input['nama'], $input['email']]);
    echo json_encode(["message" => "User berhasil ditambah", "id" => $pdo->lastInsertId()]);
}
?>