<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$pdo = new PDO("mysql:host=localhost;dbname=perpustakaan", "root", "");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    if(isset($_GET['available'])) {
        $stmt = $pdo->query("SELECT id, judul, stok FROM books WHERE stok > 0 ORDER BY judul");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } else {
        $stmt = $pdo->query("SELECT * FROM books ORDER BY id DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

if ($method == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO books (judul, penulis, stok) VALUES (?, ?, ?)");
    $stmt->execute([$input['judul'], $input['penulis'], $input['stok']]);
    echo json_encode(["message" => "Buku berhasil ditambah"]);
}

if ($method == 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("DELETE FROM books WHERE id = ?");
    $stmt->execute([$input['id']]);
    echo json_encode(["message" => "Buku berhasil dihapus"]);
}
?>