const pdf = require("pdf-parse");

const parsePDF = async (buffer) => {
  try {
    const pages = [];

    await pdf(buffer, {
      pagerender: function (pageData) {
        return pageData.getTextContent().then(function (textContent) {
          let pageText = "";
          textContent.items.forEach((item) => {
            pageText += item.str + " ";
          });
          pages.push({
            pageNumber: pageData.pageIndex + 1,
            text: pageText.trim(),
          });
        });
      },
    });

    // Fallback agar pages empty hain
    if (pages.length === 0) {
      const data = await pdf(buffer);
      pages.push({ pageNumber: 1, text: data.text });
    }

    return pages;
  } catch (error) {
    throw new Error("Error parsing PDF: " + error.message);
  }
};

module.exports = parsePDF;
