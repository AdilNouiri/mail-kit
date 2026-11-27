const strings = {
    fr: {
        fallbackLead: "Le bouton ne marche pas ? Copiez cette adresse dans votre navigateur :",
        codeLabel: "Code",
        colon: " :",
    },
    en: {
        fallbackLead: "Button not working? Paste this address into your browser:",
        codeLabel: "Code",
        colon: ":",
    },
};
export function stringsFor(lang) {
    return strings[lang];
}
/** `label : value` in French, `label: value` in English. */
export function labelled(lang, label, value) {
    return `${label}${strings[lang].colon} ${value}`;
}
