<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$pdo = new PDO("mysql:host=localhost;dbname=nabhan", "root", "");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['search'])) {
        $key = "%".$_GET['search']."%";
        $stmt = $pdo->prepare("SELECT * FROM books WHERE judul LIKE ? ORDER BY id DESC");
        $stmt->execute([$key]);
    } else if (isset($_GET['available'])) {
        $stmt = $pdo->query("SELECT id, judul, stok FROM books WHERE stok > 0 ORDER BY judul");
    } else {
        $stmt = $pdo->query("SELECT * FROM books ORDER BY id DESC");
    }
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}


if ($method === 'POST') {

    if (!isset($_FILES['cover'])) {
        echo json_encode(["message" => "Cover wajib diupload"]);
        exit();
    }

    $file = $_FILES['cover'];

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $newName = 'cover_'.time().'.'.$ext;
    $uploadPath = __DIR__ . '/../public/uploads/' . $newName;

    move_uploaded_file($file['tmp_name'], $uploadPath);

    $judul = $_POST['judul'];
    $penulis = $_POST['penulis'];
    $stok = $_POST['stok'];
    $coverUrl = '/nabhan/public/uploads/'.$newName;

    $stmt = $pdo->prepare("INSERT INTO books (judul, penulis, cover, stok) VALUES (?, ?, ?, ?)");
    $stmt->execute([$judul, $penulis, $coverUrl, $stok]);

    echo json_encode(["message" => "Buku berhasil ditambah"]);
}


if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("DELETE FROM books WHERE id = ?");
    $stmt->execute([$input['id']]);
    echo json_encode(["message" => "Buku berhasil dihapus"]);
}
?>