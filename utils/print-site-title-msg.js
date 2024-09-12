function printSiteTitleMsg({ index, site }) {
  console.log(`${index + 1}. ${site.id} - ${site.subdistrict} - ${site.name}`);
}

export default printSiteTitleMsg;
