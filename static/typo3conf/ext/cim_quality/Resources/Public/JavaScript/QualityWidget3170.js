/*jshint esversion: 6 */
(function (global) {
    "use strict";
    function QualityWidget(args) {
        this.args = args;
        this.widget = $(this.args.selector);
        this.hcaptcha = null;
        this.hcaptchaToken = null;
        this.bindForm();

        return this;
    }

    QualityWidget.prototype.bindForm = function () {
        let $this = this;
        let form = this.widget.find('form');

        let input = form.find('input');
        let submit = form.find('input[type="submit"]');
        this.hcaptcha = form.find('div.h-captcha');

        let comment = $('#comment');
        let commentTxt = $('#comment_txt');
        let emailField = $("#email");
        let showCommentZone = $('#show_comment_zone');
        let loader = $('#quality_loader');

        form[0].reset();

        input.on('change', function (e) {
            e.preventDefault();
            submit.prop('disabled', false).removeClass('is-hidden');
            $this.hcaptcha.removeClass('is-hidden');

            let checkedInput = form.find('input[value]:checked');

            if (checkedInput.val() === 'Oui') {
                commentTxt.prop('disabled', true).prop('required', false);
                if(emailField.length > 0)
                {
                    emailField.prop('disabled', true).prop('required', false);
                }
                comment.addClass('is-hidden');
                showCommentZone.attr('aria-expanded', 'false');
            }

            if (checkedInput.val() === 'Non') {
                commentTxt.prop('disabled', false).prop('required', true);
                if(emailField.length > 0)
                {
                    emailField.prop('disabled', false).prop('required', true);
                }
                comment.removeClass('is-hidden');
                showCommentZone.attr('aria-expanded', 'true');
            }
        });

        form.on('submit', function (e) {
            e.preventDefault();
            form.find("input[name='tx_cimquality_displayquality[hcaptchaTokenResponse]']").val(form.find('textarea[name="h-captcha-response"]').val());
            loader.removeClass('display_none');
            $this.submit(form);
        });
    };

    QualityWidget.prototype.submit = function (form) {
        let $this = this;
        let url = this.widget.attr('data-url');
        let successMessage = this.widget.attr('data-success-message');
        let errorMessage = this.widget.attr('data-error-message');
        this.hcaptchaToken = this.widget.find('textarea[name="h-captcha-response"]').val();
        if(this.hcaptchaToken !== '' && $this.hcaptcha.length !== 0)
        {
            $.ajax({
                method: 'POST',
                url: url,
                cache: false,
                data: form.serialize(),
                success: function (result) {
                    let message;
                    if(result.success) {
                        message = successMessage;
                    } else {
                        message = errorMessage;
                    }
                    $this.widget.prop('tabindex', -1).html("<p>" + message + "</p>");
                    $this.widget.focus();
                },
                error: function (jqXHR, textStatus, errorThrow) {
                    console.log(jqXHR, textStatus, errorThrow);
                    $this.widget.prop('tabindex', -1).html("<p>" + errorMessage + "</p>");
                    $this.widget.focus();
                }
            });
        }else{
            $this.hcaptcha.append('<p>Merci de remplir ce champ !</p>')
        }

    };

    let qualityWidget = function (args) {
        return new QualityWidget(args);
    };

    global.qualityWidget = qualityWidget;

}(this));