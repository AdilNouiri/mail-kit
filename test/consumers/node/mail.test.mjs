import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMail, VERSION } from "mail-kit";
import { samples } from "mail-kit/samples";
import { dreamStudio } from "mail-kit/themes/dream-studio";
import { majordome } from "mail-kit/themes/majordome";

const url = "https://app.example.com/login?token=EXAMPLE-TOKEN-1234";

test("renders the Majordome magic link in Node from the packed package", () => {
  const { subject, html, text } = renderMail(majordome, {
    subject: "Votre lien de connexion Majordome",
    preheader: "Valable 15 minutes, une seule fois.",
    blocks: [
      { type: "heading", text: "Votre lien de connexion" },
      {
        type: "paragraph",
        content: "Bonjour, touchez le bouton pour ouvrir votre espace Majordome.",
      },
      { type: "button", label: "Me connecter", url },
      { type: "note", content: "Le lien est valable 15 minutes et ne sert qu'une fois." },
    ],
  });
  assert.equal(subject, "Votre lien de connexion Majordome");
  assert.ok(html.length > 0);
  assert.ok(html.includes("Me connecter"));
  assert.deepEqual(html.match(/<!-- mail-kit [^>]*-->/g), [`<!-- mail-kit ${VERSION} -->`]);
  assert.ok(text.includes(url));
});

test("renders every sample with the dream-studio theme", () => {
  for (const name of ["magic-link", "code", "notice"]) {
    const mail = renderMail(dreamStudio, samples[name]("en"));
    assert.ok(mail.subject.length > 0 && mail.html.length > 0 && mail.text.length > 0);
  }
});
