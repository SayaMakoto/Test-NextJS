interface AdminPaginationProps {
  page: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({ page, totalItems, pageSize = 10, onPageChange }: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  return (
    <div className="admin-pagination" aria-label="Phân trang">
      <span>Trang {page}/{totalPages} · {totalItems} mục</span>
      <div>
        <button type="button" className="btn btn-secondary" onClick={() => onPageChange(page - 1)} disabled={page === 1}>Trước</button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <button key={pageNumber} type="button" className={`btn ${pageNumber === page ? "btn-primary" : "btn-secondary"}`} onClick={() => onPageChange(pageNumber)}>{pageNumber}</button>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>Sau</button>
      </div>
    </div>
  );
}
