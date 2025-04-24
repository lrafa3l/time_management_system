function openPdfModal(pdfUrl, title) {
    const modal = document.getElementById('pdfPreviewModal');
    const viewer = document.getElementById('pdfViewer');
    const titleElement = document.getElementById('pdfModalTitle');
    const infoElement = document.getElementById('pdfFileInfo');
    const downloadBtn = document.getElementById('pdfDownloadBtn');

    document.getElementById("pdfPreviewModal").style.display = "flex";
    document.body.classList.add("no-scroll");

    // Set PDF title
    titleElement.textContent = title || 'Visualização do PDF';

    // Set PDF file info
    infoElement.textContent = `Arquivo: ${pdfUrl.split('/').pop()}`;

    // Set PDF source
    viewer.src = pdfUrl;

    // Set download button
    downloadBtn.onclick = function () {
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = pdfUrl.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Set print button
    document.getElementById('pdfPrintBtn').onclick = function () {
        viewer.contentWindow.print();
    };

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closePdfModal() {
    const modal = document.getElementById('pdfPreviewModal');
    const viewer = document.getElementById('pdfViewer');

    document.getElementById("pdfPreviewModal").style.display = "none";
    document.body.classList.remove("no-scroll");

    // Clear PDF source
    viewer.src = '';

    // Hide modal
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
// window.onclick = function (event) {
//     const modal = document.getElementById('pdfPreviewModal');
//     if (event.target === modal) {
//         closePdfModal();
//     }
// };