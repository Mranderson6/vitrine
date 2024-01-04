(function (global) {

    function SubscribeWidget(args) {
        this.args = args;
        this.widget = $(this.args.selector);

        this.bindForm();

        return this;
    }

    SubscribeWidget.prototype.bindForm = function () {
        let $this = this;
        let form = this.widget.find('form');
        let submitBtn = form.find('input[type="submit"]');

        let loader = $('#subscribe_loader');

        form[0].reset();

        form.on('submit', function (e) {
            e.preventDefault();
            loader.removeClass('display_none');
            submitBtn.prop("disabled", "disabled");
            $this.submit(form);
        });
    };

    SubscribeWidget.prototype.reset = function () {
        let $this = this;
        let form = this.widget.find('form');
        let submitBtn = form.find('input[type="submit"]');
        let messages = this.widget.find('.message');
        form.show();
        form[0].reset();
        submitBtn.prop('disabled', '');
        messages.remove();
    };

    SubscribeWidget.prototype.submit = function () {
        let $this = this;
        let form = this.widget.find('form');
        let url = this.widget.attr('data-url');
        let successMessage = this.widget.attr('data-success-message');
        let errorMessage = this.widget.attr('data-error-message');

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
                    message = errorMessage + ' : ' + result.error;
                }
                $this.widget.prop('tabindex', -1).append(
                    $("<p>").addClass('message').text(message)
                );
                form.hide();
                $this.widget.focus();
            },
            error: function (jqXHR, textStatus, errorThrow) {
                $this.widget.prop('tabindex', -1).append(
                    $("<p>").addClass('message').text(errorMessage)
                );
                $this.widget.focus();
            }
        });
    };

    var subscribeWidget = function (args) {
        return new SubscribeWidget(args);
    };

    global.subscribeWidget = subscribeWidget;

})(this);