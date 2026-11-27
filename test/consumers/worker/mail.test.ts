import { renderMail, VERSION } from "mail-kit";
import { samples } from "mail-kit/samples";
import { dreamStudio } from "mail-kit/themes/dream-studio";
import { majordome } from "mail-kit/themes/majordome";
import { expect, it } from "vitest";

const url = "https://app.example.com/login?token=EXAMPLE-TOKEN-1234";

it("renders the Majordome magic link inside workerd from the packed package", () => {
  expect(navigator.userAgent).toBe("Cloudflare-Workers");
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
  expect(subject).toBe("Votre lien de connexion Majordome");
  expect(html.length).toBeGreaterThan(0);
  expect(html).toContain("Me connecter");
  expect(html.match(/<!-- mail-kit [^>]*-->/g)).toEqual([`<!-- mail-kit ${VERSION} -->`]);
  expect(text).toContain(url);
});

it("renders every sample with the dream-studio theme", () => {
  for (const name of ["magic-link", "code", "notice"] as const) {
    const mail = renderMail(dreamStudio, samples[name]("en"));
    expect(mail.subject.length).toBeGreaterThan(0);
    expect(mail.html.length).toBeGreaterThan(0);
    expect(mail.text.length).toBeGreaterThan(0);
  }
});
