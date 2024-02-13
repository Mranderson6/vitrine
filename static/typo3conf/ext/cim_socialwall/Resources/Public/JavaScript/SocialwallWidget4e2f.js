(function (global) {

    function SocialwallWidget(args) {
        this.args = args;
        this.widget = $(this.args.selector);
        this.container = null;
        this.posts = [];
        this.displayType = (args.displayType !== undefined) ? args.displayType : 'classic';
        this.orderBy = (args.orderBy !== undefined) ? args.orderBy : 'dateDesc';
        this.debug = args.debug || false;
        this.activeFilter = args.defaultFilter || 'all';

        if (this.debug) console.log('SocialWall', 'Debug mode is active');

        this.bind();
        this.init();

        return this;
    }

    SocialwallWidget.prototype.setDebug = function (active) {
        let $this = this;
        $this.debug = active;
    };

    SocialwallWidget.prototype.init = function () {
        let $this = this;
        $this.container = $this.widget.find('#sw_flux');

        for (let i = 0; i < this.args.ajaxUriList.length; i++) {
            $.ajax({
                method: 'POST',
                url: $this.args.ajaxUriList[i],
                dataType: 'json',
                cache: false,
                success: function (response) {
                    $this.injectPosts(response);
                    $this.refreshFilters();
                },
                error: function (jqXHR, textStatus, errorThrow) {
                    console.log(jqXHR, textStatus, errorThrow);
                }
            });
        }
    };

    SocialwallWidget.prototype.bind = function () {
        let $this = this;

        // onFiltered Event : triggered by INT in social_wall.js
        $(document).on('onSocialWallFiltered', function (e, network) {
            $this.onFiltered(network);
        });
    };

    SocialwallWidget.prototype.injectPosts = function (result) {
        let $this = this;
        if (result.posts) {
            // add returned posts to global posts array
            result.posts.forEach(function (post, index) {
                post.page = result.page;
                $this.posts.push(post);
            });

            // sort items
            if ($this.orderBy === 'dateDesc') { // DATE DESC

                $this.posts.sort(sortByDateDesc);

            } else if ($this.orderBy === 'random') { // RANDOM
                // since this shuffle method only invert the position with neighbours, we have to do it multiple times
                // FAUDRA QUE JE TROUVE UNE AUTRE METHODE, PARCE QUE C'EST UN PEU DEGUEULASSE QUAND MEME
                $this.posts.sort(shuffle);
                $this.posts.sort(shuffle);
                $this.posts.sort(shuffle);
                $this.posts.sort(shuffle);
                $this.posts.sort(shuffle);
                $this.posts.sort(shuffle);
                $this.posts.sort(shuffle);
                $this.posts.sort(shuffle);
                $this.posts.sort(shuffle);
                $this.posts.sort(shuffle);
            }

            function sortByDateDesc(a, b) {
                return (b.post.date.localeCompare(a.post.date)); // simple shuffle
            }

            function shuffle(a, b) {
                return (0.5 - Math.random()); // simple shuffle
            }

            // remove all items
            $this.container.find('.sw_item').remove();

            let metroIndices = [
                {name: 'facebook', index: 0},
                {name: 'twitter', index: 0},
                {name: 'youtube', index: 0},
                {name: 'instagram', index: 0},
            ];

            function getIndiceIdByNetwork(network) {
                for (let i = 0; i < metroIndices.length; i++) {
                    if (metroIndices[i].name === network)
                        return i;
                }
            }

            function getPostByNetworkAndIndex(targetNetwork, targetIndex) {
                let currentIndex = 0;
                for (let i = 0; i < $this.posts.length; i++) {
                    let post = $this.posts[i];
                    if (post.page.network === targetNetwork) {
                        if (currentIndex >= targetIndex) {
                            return post;
                        }
                        currentIndex++;
                    }
                }
                return undefined;
            }

            // display the posts according to the metro config
            if ($this.displayType === 'metro') {
                if ($this.args.metroConfig.length > 0) {
                    for (let networkIndex = 0; networkIndex < $this.args.metroConfig.length; networkIndex++) {
                        let network = $this.args.metroConfig[networkIndex].network;
                        let metroIndicesIndex = getIndiceIdByNetwork(network);

                        let post = getPostByNetworkAndIndex(network, metroIndices[metroIndicesIndex].index);

                        if (post !== undefined) {
                            $(post.html)
                                .appendTo($this.container);
                            metroIndices[metroIndicesIndex].index++;
                        }
                    }
                }
            }

            // enqueue the posts array
            let networkCounter = {
                'facebook': 0,
                'twitter': 0,
                'youtube': 0,
                'instagram': 0,
            };
            let $posts = [];
            for (let i = 0; i < $this.posts.length; i++) {
                let post = $this.posts[i];
                let metroIndicesIndex = getIndiceIdByNetwork(post.page.network);

                if (networkCounter[post.page.network] >= metroIndices[metroIndicesIndex].index) {
                    let $post = $(post.html);
                    $posts.push($post);
                    $post.appendTo($this.container);
                }
                networkCounter[post.page.network]++;
            }

            // update masonry
            if ($this.container.masonry !== undefined) {
                $this.container.masonry('appended', $posts);
                $this.container.masonry('layout');
            }

            // Set additional classes
            if ($this.displayType === 'metro') {
                if ($this.args.metroConfig.length > 0) {
                    let $items = $($this.args.selector + " .sw_item");
                    for (let networkIndex = 0; networkIndex < $this.args.metroConfig.length; networkIndex++) {
                        let classes = $this.args.metroConfig[networkIndex].classes;
                        $items.eq(networkIndex)
                            .addClass(classes)
                            .attr('data-class', classes);
                    }
                }
            }

            // set 'first' class
            $this.onFiltered($this.activeFilter);

            // lazy load for images
            let $images = document.querySelectorAll($this.args.selector + " img.lazy");
            new Hunt($images, {
                enter: function (e) {
                    e.src = e.dataset.src;
                }
            });

            // animation d'apparition
            let items = $('.sw_item');
            filtering = ($this.activeFilter !== "all");
            if (typeof timerFunction_SW == 'function') {
                timerFunction_SW(items, filtering);
            } else if ($this.debug) {
                console.log('SocialWall', 'timerFunction_SW() does not exists is hidden');
            }
        }
    };

    SocialwallWidget.prototype.refreshFilters = function () {
        let $this = this;
        let $filters = $("#sw_filters li:not(.all)");

        $filters.each(function () {
            let network = $(this)
                .find("button")
                .attr("data-title")
                .toLowerCase();

            let countPost = $this.widget.find(".item_" + network).length;

            if (countPost === 0) {
                $(this).addClass('hide');
                if ($this.debug) console.log('SocialWall', 'refreshFilters', network + ' is hidden');
            } else {
                $(this).removeClass('hide');
                if ($this.debug) console.log('SocialWall', 'refreshFilters', network + ' is shown');
            }
        });
    };

    SocialwallWidget.prototype.onFiltered = function (network) {
        let $this = this;

        // remove first class
        $this.widget.find('.sw_item').removeClass('first');

        // add 'first' class on the first filtered element
        let $firstItem = (network === 'all')
            ? $this.widget.find('.sw_item')
            : $this.widget.find('.item_' + network);
        $firstItem.eq(0).addClass('first');

        // set active filter
        $this.activeFilter = network;

        if ($this.debug) console.log('SocialWall', 'onFiltered', 'The active filter is now ' + network);

    };

    let socialwallWidget = function (args) {
        return new SocialwallWidget(args);
    };

    global.socialwallWidget = socialwallWidget;

})(this);