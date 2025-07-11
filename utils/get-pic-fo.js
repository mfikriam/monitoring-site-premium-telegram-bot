function getPICFO(witels) {
  const picFO = {
    SULSEL: '@jodryjft @‌AsdiRamli @jeffrianto87 @taufik_syam',
    'SULSEL BARAT': '@anthyarifin @SUTRYSNO_HADISAPUTRA @Lannyadelin',
    SULTRA: '@hermanbatari @President_Mr @rizaldy_pahlevi @Adityaerawann',
    SULTENG: '@flow_like_river @Cloverdifferents @indralaopa',
    GORONTALO: '@GoGtoOlo @Internet_Positiff @imam_alr @mpragnya',
    'SULUT MALUT': '@JohannNicky @Putu_Oka_082187385141 @mirino_aem',
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
