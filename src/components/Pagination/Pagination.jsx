import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems, scrollToRef }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const scrollToTop = () => {
    if (scrollToRef && scrollToRef.current) {
      scrollToRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      scrollToTop();
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      scrollToTop();
    }
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page);
      scrollToTop();
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-4 py-8" dir="rtl">
      {/* أزرار الصفحات */}
      <div className="flex items-center gap-2">
        {/* زر السابق */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50"
          style={{ 
            borderColor: '#0171BD',
            color: currentPage === 1 ? '#9CA3AF' : '#0171BD',
            fontFamily: 'Almarai',
            fontWeight: 600
          }}
        >
          السابق
        </button>

        {/* أرقام الصفحات */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => handlePageClick(page)}
              disabled={page === '...'}
              className={`min-w-[40px] h-10 rounded-lg transition-all ${
                page === currentPage
                  ? 'text-white'
                  : page === '...'
                  ? 'cursor-default'
                  : 'hover:bg-blue-50'
              }`}
              style={{
                backgroundColor: page === currentPage ? '#0171BD' : 'transparent',
                border: page === currentPage ? 'none' : '1px solid #E5E7EB',
                color: page === currentPage ? '#FFFFFF' : page === '...' ? '#9CA3AF' : '#374151',
                fontFamily: 'Almarai',
                fontWeight: page === currentPage ? 700 : 500
              }}
            >
              {page}
            </button>
          ))}
        </div>

        {/* زر التالي */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50"
          style={{ 
            borderColor: '#0171BD',
            color: currentPage === totalPages ? '#9CA3AF' : '#0171BD',
            fontFamily: 'Almarai',
            fontWeight: 600
          }}
        >
          التالي
        </button>
      </div>
    </div>
  );
};

export default Pagination;
