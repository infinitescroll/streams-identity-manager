const clonedeep = require("lodash.clonedeep");

const pointsToCeramicDoc = (v) => {
  const matcher = new RegExp("^ceramic://.+(\\?version=.+)?");
  return matcher.test(v);
};

const resolveDoc = async (ceramic, doc, prependID) => {
  const rDoc = await ceramic.loadDocument(doc);
  if (prependID) {
    const docWithID = clonedeep(rDoc.content);
    docWithID.id = doc;
    return docWithID;
  }
  return rDoc.content;
};

module.exports = async (docTree, ceramic, appendDocId) => {
  if (typeof docTree !== "object" || Array.isArray(docTree))
    throw new Error("docTree must be an object");
  const tree = clonedeep(docTree);
  const visitedDocs = new Set([]);
  const recurse = async (node) => {
    if (typeof node === "object") {
      for (key in node) {
        node[key] = await recurse(node[key]);
      }
    } else if (Array.isArray(node)) {
      return Promise.all(node.map((v) => recurse(v)));
    } else if (pointsToCeramicDoc(node) && !visitedDocs.has(node)) {
      visitedDocs.add(node);
      const rDoc = await resolveDoc(ceramic, node, appendDocId);
      return recurse(rDoc);
    }

    return node;
  };

  return recurse(tree);
};
