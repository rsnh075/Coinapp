let _browserLanguage    = window.navigator.language;
const browserLanguage   = String(_browserLanguage.split("-")[0]).toLowerCase();

export let COIN_LABELS = <any>{};

const COIN_LABELS_EN = {
    "coinapp": {
        "filterlabels": ["Company", "City", "Street", "Number", "Postal Code", "Province", "First Name", "Middle name", "Last name", "Family name", "Name"],
        "resultheaderlabels": ["Name", "Phone number", "Street", "Number", "Postal Code", "City"],
        "submitbuttonlabel" : "Search number",
        "selectlbl" : "Select your option",
        "resultcountlabels" : ["Search result: ", "numbers"],
        "loccomplcitylabels" : ["City: ", "Municipality: ", "Province: "],
        "loccomplstreetlabels" : ["Sreet: ", "City: ", "Municipality: ", "Province: "],
        "coinappheaderlabel" : "COIN subscriber info",
    },
};

const COIN_LABELS_NL = {
    "coinapp": {
        "filterlabels": ["Bedrijf", "Plaats", "Straat", "Nummer", "Postcode", "Provincie", "Voornaam", "Tussenvoegsel", "Achternaam", "Familienaam", "Naam"],
        "resultheaderlabels": ["Naam", "Telefoonnummer", "Straat", "Nummer", "Postcode", "Plaats"],
        "submitbuttonlabel" : "Zoek nummer",
        "selectlbl" : "Selecteer een waarde",
        "resultcountlabels" : ["Zoekresultaat: ", "nummers"],
        "loccomplcitylabels" : ["Plaats: ", "Gemeente: ", "Provincie: "],
        "loccomplstreetlabels" : ["Straat: ", "Plaats: ", "Gemeent: ", "Provincie: "],
        "coinappheaderlabel" : "COIN abonnee-informatie",
    },
};


if(browserLanguage == 'en')
  COIN_LABELS = Object.assign({}, COIN_LABELS_EN);
else
  COIN_LABELS = Object.assign({}, COIN_LABELS_NL);
