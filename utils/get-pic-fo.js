function getPICFO(witels) {
  const picFO = {
    SULSEL: '@jodryjft @BOSSNYA_PENGUSAHA @jeffrianto87 @ommaros',
    'SULSEL BARAT': '@markus_taba @SUTRYSNO_HADISAPUTRA @Lannyadelin',
    SULTRA: '@hermanbatari @President_Mr @rizaldy_pahlevi @Adityaerawann',
    SULTENG: '@flow_like_river @Cloverdifferents @indralaopa',
    GORONTALO: '@GoGtoOlo @Internet_Positiff @imam_alr @mpragnya',
    'SULUT MALUT': '@ndrew_MP @Putu_Oka_082187385141 @ismailahsan',
    MALUKU: '@ABO_AO_JOHN @Ampongjua @noviyntk',
    PAPUA: '@Syowii @cumaAnakBawang @fazanugroho',
    'PAPUA BARAT': '@engelberthus @Selangkah_Di_Depan @Pitgbay',
  };

  let stringPIC = '@ipyamol @fatahud';

  // Get unique witels using Set
  const uniqueWitels = [...new Set(witels)];

  uniqueWitels.forEach((witel) => {
    if (picFO[witel]) {
      stringPIC += ' ' + picFO[witel];
    }
  });

  return 'CC: ' + stringPIC;
}

export default getPICFO;
