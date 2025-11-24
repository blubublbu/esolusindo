<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$pdo = new PDO("mysql:host=localhost;dbname=nabhan", "root", "");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT l.*, b.judul, u.nama 
        FROM loans l 
        JOIN books b ON l.book_id = b.id 
        LEFT JOIN users u ON l.user_id = u.id 
        ORDER BY l.id DESC
    ");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $stmt = $pdo->prepare("SELECT stok FROM books WHERE id = ? FOR UPDATE");
    $stmt->execute([$input['book_id']]);
    $book = $stmt->fetch();

    if ($book && $book['stok'] > 0) {
        $pdo->beginTransaction();
        $pdo->prepare("UPDATE books SET stok = stok - 1 WHERE id = ?")->execute([$input['book_id']]);
        $pdo->prepare("INSERT INTO loans (user_id, book_id, tanggal_pinjam, status) VALUES (?, ?, CURDATE(), 'dipinjam')")
            ->execute([$input['user_id'], $input['book_id']]);
        $pdo->commit();
        echo json_encode(["message" => "Buku berhasil dipinjam"]);
    } else {
        echo json_encode(["message" => "Stok habis"]);
    }
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    $pdo->beginTransaction();
    $pdo->prepare("UPDATE loans SET status = 'dikembalikan', tanggal_kembali = CURDATE() WHERE id = ?")
        ->execute([$input['id']]);

    $stmt = $pdo->prepare("SELECT book_id FROM loans WHERE id = ?");
    $stmt->execute([$input['id']]);
    $loan = $stmt->fetch();

    $pdo->prepare("UPDATE books SET stok = stok + 1 WHERE id = ?")->execute([$loan['book_id']]);
    $pdo->commit();

    echo json_encode(["message" => "Buku berhasil dikembalikan"]);
}
?>