// Validation errors messages for Parsley
// Load this after Parsley

Parsley.addMessages('fr', {
    defaultMessage: "Cette valeur semble non valide.",
    type: {
        email: "Cette adresse email n'est pas valide ! (ex: nom.prenom@domaine.fr)",
        url: "Cette url n'est pas valide ! (ex: https://domaine.fr)",
        number: "Cette valeur doit être un nombre.",
        integer: "Cette valeur doit être un entier.",
        digits: "Cette valeur doit être numérique.",
        alphanum: "Cette valeur doit être alphanumérique."
    },
    notblank: "Cette valeur ne peut pas être vide.",
    required: "Ce champ est requis.",
    pattern: "Cette valeur semble non valide.",
    min: "Cette valeur ne doit pas être inférieure à %s.",
    max: "Cette valeur ne doit pas excéder %s.",
    range: "Cette valeur doit être comprise entre %s et %s.",
    minlength: "Cette chaîne est trop courte. Elle doit avoir au minimum %s caractères.",
    maxlength: "Cette chaîne est trop longue. Elle doit avoir au maximum %s caractères.",
    length: "Cette valeur doit contenir entre %s et %s caractères.",
    mincheck: "Vous devez sélectionner au moins %s choix.",
    maxcheck: "Vous devez sélectionner %s choix maximum.",
    check: "Vous devez sélectionner entre %s et %s choix.",
    equalto: "Cette valeur devrait être identique."
});

Parsley.setLocale('fr');

Parsley
    .addValidator('phone', {
        requirementType: 'string',
        validateString: function (value, requirement) {
            const regex = RegExp('^[+]?[(]?[0-9]{1,3}[)]?[-\\s\\.0-9]{9,15}$', 'gm');

            let isValid = false;

            let m;
            while ((m = regex.exec(value)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }

                // The result can be accessed through the `m`-variable.
                m.forEach((match, groupIndex) => {
                    isValid = true;
                });
            }

            return isValid;
        },
        messages: {
            en: "This is not a valid phone number ! (ex: 0123456789 ou +(33) 1 23 45 67 89)",
            fr: "Ce numéro de téléphone n'est pas valide ! (ex: 0123456789 ou +(33) 1 23 45 67 89)",
        }
    });