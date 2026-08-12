const A4_HEIGHT_MM = 297
const A4_MARGIN_MM = 8
const MM_TO_PX = 96 / 25.4
const PAGE_CONTENT_HEIGHT_PX = (A4_HEIGHT_MM - A4_MARGIN_MM * 2) * MM_TO_PX

function getBlocks() {
  return document.querySelectorAll<HTMLElement>("[data-print-block]")
}

function applyPageBreakLayout() {
  getBlocks().forEach((block) => {
    const anchor = block.querySelector<HTMLElement>("[data-print-break-anchor]")
    const notice = block.querySelector<HTMLElement>("[data-print-break-notice]")
    if (!anchor || !notice) return

    const blockTop = block.getBoundingClientRect().top
    const anchorRect = anchor.getBoundingClientRect()
    const heightBeforeAnchor = anchorRect.top - blockTop

    if (heightBeforeAnchor + anchorRect.height > PAGE_CONTENT_HEIGHT_PX) {
      anchor.style.breakBefore = "page"
      anchor.style.pageBreakBefore = "always"
      notice.style.display = "block"
    } else {
      anchor.style.breakBefore = ""
      anchor.style.pageBreakBefore = ""
      notice.style.display = "none"
    }
  })
}

function resetPageBreakLayout() {
  getBlocks().forEach((block) => {
    const anchor = block.querySelector<HTMLElement>("[data-print-break-anchor]")
    const notice = block.querySelector<HTMLElement>("[data-print-break-notice]")
    if (anchor) {
      anchor.style.breakBefore = ""
      anchor.style.pageBreakBefore = ""
    }
    if (notice) notice.style.display = "none"
  })
}

export function setupPrintPageBreakNotices() {
  window.addEventListener("beforeprint", applyPageBreakLayout)
  window.addEventListener("afterprint", resetPageBreakLayout)

  return () => {
    window.removeEventListener("beforeprint", applyPageBreakLayout)
    window.removeEventListener("afterprint", resetPageBreakLayout)
    resetPageBreakLayout()
  }
}
