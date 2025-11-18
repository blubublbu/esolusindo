<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');
header('Access-Control-Allow-Headers: Content-Type');

$pdo = new PDO("mysql:host=localhost;dbname=perpustakaan", "root", "");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $stmt = $pdo->query("SELECT l.*, b.judul FROM loans l JOIN books b ON l.book_id = b.id ORDER BY l.id DESC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    
    $stmt = $pdo->prepare("SELECT stok FROM books WHERE id = ?");
    $stmt->execute([$input['book_id']]);
    $book = $stmt->fetch();
    
    if ($book && $book['stok'] > 0) {
        $pdo->prepare("UPDATE books SET stok = stok - 1 WHERE id = ?")->execute([$input['book_id']]);
        $pdo->prepare("INSERT INTO loans (user_id, book_id, tanggal_pinjam) VALUES (?, ?, CURDATE())")
            ->execute([$input['user_id'], $input['book_id']]);
        echo json_encode(["message" => "Buku berhasil dipinjam"]);
    } else {
        echo json_encode(["message" => "Stok habis"]);
    }
}

if ($method == 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $pdo->prepare("UPDATE loans SET status = 'dikembalikan', tanggal_kembali = CURDATE() WHERE id = ?")
        ->execute([$input['id']]);
    
    
    $stmt = $pdo->prepare("SELECT book_id FROM loans WHERE id = ?");
    $stmt->execute([$input['id']]);
    $loan = $stmt->fetch();
    $pdo->prepare("UPDATE books SET stok = stok + 1 WHERE id = ?")->execute([$loan['book_id']]);
    
    echo json_encode(["message" => "Buku berhasil dikembalikan"]);
}
?>