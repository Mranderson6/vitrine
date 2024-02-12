(function (global) {

    function CimeosList(args) {

        this.args = args;
        this.domConfig = $('#' + this.args.config);

        this.href = window.location.href;

        this.config = {};
        this.config.idMap = this.domConfig.attr('data-id-map');
        this.config.urlGeo = this.domConfig.attr('data-url-geo');
        this.config.urlScroll = this.domConfig.attr('data-url-scroll');
        this.config.urlShow = this.domConfig.attr('data-url-show');
        this.config.form = this.domConfig.attr('data-form');
        this.config.totalRecords = parseInt(this.domConfig.attr('data-total-records'));
        this.config.activeContentElement = this.domConfig.attr('data-active-content-element');
        this.config.autoSend = this.domConfig.attr('data-auto-send');
        this.config.templateScroll = this.domConfig.attr('data-template-scroll');
        this.config.updateAggs = this.domConfig.attr('data-update-aggs');
        this.config.displayType = this.domConfig.attr('data-display-type') || 'displayListPopin';
        this.config.displayPopupTemplate = this.domConfig.attr('data-display-popup-template') || 'popup';
        this.config.displayPopupClass = this.domConfig.attr('data-display-popup-class') || '';
        this.config.autoloadMarkers = this.domConfig.attr('data-autoload-markers') || false; // charge automatiquement les markers à l'initialisation de la carte
        this.config.modalContentId = this.domConfig.attr('data-modal-content-id') || 'modal_multi';
        this.config.showResults = this.domConfig.attr('data-showResults') === '1';

        this.config.mapType = this.domConfig.attr('data-map-type') || 'osm';
        this.config.mapboxRootpath = this.domConfig.attr('data-mapbox-rootpath') || 'fileadmin/templates/master/assets/assets_site_common/js/vendor/cimeos_mapbox/';
        this.config.siteId = this.domConfig.attr('data-site-id') || 'Master';

        this.currentIndexPopin = 0;
        this.currentItemListPopin = null;

        this.shouldLoad = this.config.showResults;
        this.isLoading = false;
        this.isLoadingGeo = false;
        this.page = 1;
        this.totalRecords = this.config.totalRecords;
        this.useAjax = true;
        this.ajaxUpdate = null;
        this.timeOut = null;
        this.ajaxGeo = null;
        this.isInteractiveMap = false;
        this.isLoaderActive = false;
        this.isGlossary = false;

        this.masonryContainer = $('#masonry');
        this.isMasonry = this.masonryContainer.length === 1;

        this.topResultsContainer = $("#first_display .first_results");
        this.isTopResults = this.topResultsContainer.length === 1;

        this.data = [];
        this.form = $('#' + this.config.form + this.config.activeContentElement);
        this.filters = $('#filters');
        this.moreFilters = $('#more_filters');
        this.forms = $('form[id^="cimsearchelastic_form_"], form[id^="tx_cimsearch_form_"]');
        this.activeForm = $('<form>');
        this.activeFilters = $('#active_filters_container');
        this.nearmeFeature = null;
        this.nearmeAddress = null;

        this.aggs = {};

        if (this.config.updateAggs) {
            this.currentAggs = null;
            this.aggs = this.filters.find("[data-aggs=\"1\"]");
            this.moreAggsButton = $('button.btn_more_filters');
            this.moreAggs = this.moreFilters.find("[data-aggs=\"1\"]");
            this.maxMoreAggs = this.moreAggs.length;
        }

        this.activePopin = null;

        return this;
    }

    CimeosList.prototype.loydBenz = function (useAjax) {
        let $this = this;

        if (useAjax !== undefined) {
            $this.useAjax = useAjax;
        }

        if ($this.useAjax) {
            $this.updateDataForm(true);
            if ($this.hasMap()) {
                $this.initMap(this.config.mapType, $this.config.siteId + '/list');
            }
            $this.bindForm();
            $this.bindResetForm();
            $this.bindPopin();
            $this.bindClosePopin();
            //$this.bindArrowPopin();
            $this.bindScroll();
            $this.bindPopstate();

            if (this.config.showResults) {
                $this.scroll();
            }

            $this.computeItemsState();
            $this.showResetBtnDependingOnActiveFilters();
            $this.prefilterFromQuery();
        } else {
            $this.bindForm();
            $this.bindResetForm();
            $this.showResetBtnDependingOnActiveFilters();
        }

        return this;
    };

    CimeosList.prototype.loydInteractivBenz = function (useAjax) {
        let $this = this;

        $this.isInteractiveMap = true;
        $this.displayLoader();
        $this.updateDataForm(true);
        $this.initMap(this.config.mapType, 'map');
        $this.bindForm();
        $this.bindResetForm();
        $this.bindPopin();
        $this.bindClosePopin();
        $this.bindArrowPopin();
        $this.bindScroll();
        $this.bindPopstate();
        $this.computeItemsState();
        $this.showResetBtnDependingOnActiveFilters();

        let update = setInterval(function () {
            if (typeof $this.map.map !== 'undefined' && $this.map.map.loaded()) {
                $this.prefilterFromQuery();
                $this.removeLoader();
                clearInterval(update);
            }
        }, 100);


        return this;
    };

    CimeosList.prototype.loydTinyInteractivBenz = function (useAjax) {
        let $this = this;

        $this.updateDataForm(true);
        if ($this.hasMap()) {
            $this.initMap(this.config.mapType, 'block');
        }

        return this;
    };

    CimeosList.prototype.loydGlossaryBenz = function (useAjax) {
        let $this = this;

        $this.isGlossary = true;

        $this.updateDataForm(true);
        $this.bindForm();
        $this.bindResetForm();

        return this;
    };

    CimeosList.prototype.computeItemsState = function () {
        let $this = this;

        let items = $('#zone_results').find('article');

        $.each(items, function (i) {
            if (typeof $(this).attr('data-open-hours') !== 'undefined' && $(this).attr('data-open-hours').length) {
                let $openHours = new openHoursWidget({selector: '#' + $(this).attr('id')});
                $openHours.showState();
            }
        });

    };

    CimeosList.prototype.initMap = function (source = 'osm', configFile = 'list') {

        let $this = this;

        if (!$this.hasMap()) {
            return this;
        }

        let mapDisplay = setInterval(function () {
            if ($('#' + $this.config.idMap).is(':visible')) {
                $this.map = new CimeosMapbox({
                    el: $this.config.idMap,
                    source: source,
                    configFile: configFile,
                    rootPath: $this.config.mapboxRootpath,
                });

                // charge automatiquement les markers à l'initialisation de la carte
                if ($this.config.autoloadMarkers) {
                    $this.loadMarkers();
                }

                clearInterval(mapDisplay);
            }
        }, 100);


        $('#second_display').on('off.zf.toggler', function () {

            let update = setInterval(function () {
                if (typeof $this.map !== 'undefined' && typeof $this.map.map !== 'undefined' && $this.map.map.loaded()) {
                    $this.map.map.resize();
                    $this.loadMarkers();
                    clearInterval(update);
                }
            }, 100);

        });

        $($this).on('updateForm', function () {
            if (typeof $this.map !== 'undefined') {
                $this.map.map.resize();
                $this.loadMarkers();
            }
        });

        return this;
    };

    CimeosList.prototype.loadMarkers = function () {

        let $this = this;

        if (!$this.hasMap()) {
            return this;
        }

        if ($this.isInteractiveMap) {
            $this.displayLoader();
        }

        $this.map.clearAll();

        if ($this.ajaxGeo != null) {
            $this.ajaxGeo.abort();
            $this.ajaxGeo = null;
        }

        $this.ajaxGeo = $.ajax({
            method: "POST",
            url: $this.config.urlGeo,
            data: $this.data
        }).done(function (response) {

            $this.ajaxGeo = null;
            $this.map.clearAll();

            if (typeof $this.map.popup !== 'undefined' && $this.map.popup !== null && $this.map.popup.isOpen()) {
                $this.map.popup.remove();
            }

            if (response.documents.length) {

                $.each(response.documents, function (index, doc) {

                    var onClick;

                    if ($this.config.displayType === 'displayListPopin') {
                        onClick = {
                            callback: "displayListPopin",
                            args: {
                                uid: doc.uid,
                                contentElementId: doc.contentElementId,
                                title: doc.title,
                                url: doc.url
                            }
                        };
                    }

                    if ($this.config.displayType === 'displayPopup') {
                        let ajaxData = [];
                        ajaxData.push({
                            name: 'tx_cimsearchelastic_displaysearch[contentElementId]',
                            value: doc.contentElementId
                        });
                        ajaxData.push({name: 'tx_cimsearchelastic_displaysearch[itemUid]', value: doc.uid});
                        ajaxData.push({name: 'tx_cimsearchelastic_displaysearch[itemPid]', value: doc.pid});
                        ajaxData.push({
                            name: 'tx_cimsearchelastic_displaysearch[template]',
                            value: $this.config.displayPopupTemplate
                        });

                        onClick = {
                            callback: "displayPopup",
                            args: {
                                templateId: "popin_poi",
                                additionalCssClasses: $this.config.displayPopupClass,
                                contentId: $this.config.modalContentId,
                                ajax: {
                                    url: $this.config.urlShow,
                                    valuesField: "document",
                                    data: ajaxData,
                                    useLocalTemplate: 0
                                }
                            }
                        };
                    }

                    if (doc.mapGeometry) {
                        let dataGeometry = JSON.parse(doc.mapGeometry);
                        $.each(dataGeometry, function (i, geometry) {
                            $this.map.addGeometry({
                                geometry: geometry,
                                properties: {
                                    sourceType: doc.type,
                                    title: doc.title,
                                    shouldDisplayPopupOnHover: true,
                                    category: typeof doc.categories !== 'undefined' && typeof doc.categories[0] !== 'undefined' ? doc.categories[0].uid : null,
                                    pid: doc.pid,
                                    uid: doc.uid,
                                    onClick: onClick
                                },
                            });
                        });
                    }

                    if (doc.mapLatitude && doc.mapLongitude) {
                        $this.map.addMarker({
                            latitude: doc.mapLatitude,
                            longitude: doc.mapLongitude,
                            properties: {
                                sourceType: doc.type,
                                title: doc.title,
                                category: typeof doc.categories !== 'undefined' && typeof doc.categories[0] !== 'undefined' ? doc.categories[0].uid : null,
                                pid: doc.pid,
                                uid: doc.uid,
                                onClick: onClick
                            },
                        });
                    } else if (typeof doc.place !== 'undefined' && doc.place.mapLatitude && doc.place.mapLongitude) {
                        $this.map.addMarker({
                            latitude: doc.place.mapLatitude,
                            longitude: doc.place.mapLongitude,
                            properties: {
                                sourceType: doc.type,
                                title: doc.title,
                                category: typeof doc.categories[0] !== 'undefined' ? doc.categories[0].uid : null,
                                pid: doc.pid,
                                uid: doc.uid,
                                onClick: onClick
                            },
                        });
                    } else if (typeof doc.city !== 'undefined' && doc.city.mapLatitude && doc.city.mapLongitude) {
                        $this.map.addMarker({
                            latitude: doc.city.mapLatitude,
                            longitude: doc.city.mapLongitude,
                            properties: {
                                sourceType: doc.type,
                                title: doc.title,
                                category: typeof doc.categories[0] !== 'undefined' ? doc.categories[0].uid : null,
                                pid: doc.pid,
                                uid: doc.uid,
                                onClick: onClick
                            },
                        });
                    }
                });

                $this.map.map.resize();
                $this.map.fitBounds();

                if ($('#second_display .sticky').length) {
                    $('#second_display .sticky').foundation("_calc", true);
                    // #41354 var min_height = $("#second_display #zone_map").innerHeight();
                    // #41354 $('#second_display').css("max-height", min_height);
                    Foundation.reInit($('#second_display .sticky'));
                }
            }

            $this.removeLoader();
        });

        return this;
    };

    CimeosList.prototype.scroll = async function () {

        let $this = this;

        $this.showResetBtnDependingOnActiveFilters();
        if ($this.isMasonry && !$this.masonryContainerActive()) {
            return this;
        }

        if ($this.shouldLoad && !$this.isLoading) {
            $this.isLoading = true;
            // on affiche le loader
            $('#searchLoader').removeClass('hide');

            let data = $this.data.slice(0);
            data.push({name: 'tx_cimsearchelastic_displaysearch[page]', value: $this.page});
            data.push({name: 'mapIsHidden', value: !$('#map_search').is(':visible')});

            await $.ajax({
                url: $this.config.urlScroll,
                type: 'POST',
                data: data,
            }).done(function (data) {

                $this.isLoading = false;
                let obj = data;
                if (obj.content !== undefined && obj.content.length > 1) {
                    let objContent = $(obj.content);

                    if ($this.isMasonry) {
                        let elements = objContent.filter('article');
                        $this.masonryContainer.append(elements);
                        if ($this.masonryContainer.hasClass('initialized')) {
                            $this.masonryContainer.masonry('appended', elements);
                        }
                    } else {
                        $('#more_results_append').before(objContent);
                    }

                    $this.page += 1;
                    $this.shouldLoad = true;

                    // on cache le loader et le no_result
                    $('#searchLoader').addClass('hide');
                    $('.no_result').addClass('hide');

                    $this.bindPopin();
                    $this.computeItemsState();
                    $this.lazy();

                    if (typeof timerFunctionListSearch !== 'undefined') {
                        timerFunctionListSearch();
                    }

                    if ($('.accordion').length) {
                        Foundation.reInit($('[data-accordion]'));
                    }
                    if ($('#second_display .sticky').length) {
                        $('#second_display .sticky').foundation("_calc", true);
                        Foundation.reInit($('#second_display .sticky'));
                    }

           			// https://projects.cameros.fr/issues/48669
           			if ($('#line_tools_moteur').length) {
                        $('#line_tools_moteur').foundation('_calc', true, 0);
                    }
                } else {
                    $this.shouldLoad = false;
                    // on cache le loader
                    $('#searchLoader').addClass('hide');
                }
            });
        }
        return this;
    };

    CimeosList.prototype.prefilterFromQuery = function () {
        let $this = this;
        let query = window.location.search;
        let args = this.parseQuery(query);

        $.each(args, function (name, agg) {
            if (name.startsWith('prefilter')) {
                let input = $this.filters.find('[data-agg-item-key="' + agg + '"] input');
                $(input).trigger('click');
            }
            if (name.startsWith('date')) {
                let input = $('#period_agenda');
                $(input).val(agg).trigger('change');
            }
        });
    };

    CimeosList.prototype.updateAggs = function (aggs) {
        let $this = this;
        let activeAggsFieldset = 0;
        let activeMoreAggsFieldset = 0;

        $.each(this.aggs, function (i, agg) {
            let aggName = $(agg).attr('data-agg-name');
            let currentActiveAgg = $(agg).find('input[type="checkbox"]:checked');
            let isActiveAgg = currentActiveAgg.length > 0;

            if (isActiveAgg) {
                activeAggsFieldset++;
                $this.lastActiveAggName = aggName;
            }

            if (aggName !== $this.currentAggs && typeof aggs[aggName] !== 'undefined' || !isActiveAgg) {
                let aggUpdated = aggs[aggName];
                let aggOptions = $(agg).find("[data-agg-item-key]");
                let activeAgg = 0;

                $.each(aggOptions, function (i, option) {
                    let aggOptionKey = $(option).attr("data-agg-item-key");

                    var filteredAggOptionUpdated = $(aggUpdated).filter(function (i) {
                        return (aggUpdated[i].key == aggOptionKey);
                    });

                    if (filteredAggOptionUpdated.length === 0) {
                        $(option).hide();
                    } else {
                        activeAgg++;
                        $(option).show();
                        $(option).find('span.count').text(filteredAggOptionUpdated[0].doc_count);
                    }
                });

                if (activeAgg === 0) {
                    $(agg).hide();
                } else {
                    $(agg).show();
                    if ($(agg).closest("#more_filters").length) {
                        activeMoreAggsFieldset++
                    }
                }
            }
        });

        if (activeAggsFieldset === 1) {
            $this.filters.find('[data-agg-name="' + $this.lastActiveAggName + '"] [data-agg-item-key]').show();
        }

        if (activeMoreAggsFieldset === 0) {
            $this.moreAggsButton.hide();
        } else {
            $this.moreAggsButton.show();
        }

    };

    CimeosList.prototype.bindScroll = function () {

        let $this = this;

        // on cache le loader par défaut
        $("#searchLoader").addClass('hide');

        if ($('#list_items').length > 0) {
            $(document).on('_scroll', function (e) {
                let rect = document.getElementById('more_results_append').getBoundingClientRect();
                let elemTop = rect.top;
                let elemBottom = rect.bottom;

                let isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);

                if (isVisible && !$this.isLoading && $this.shouldLoad) {
                    $this.scroll();
                }
            });
        }

        $('#btn_more_results').on('click', function (e) {
            $this.scroll();
        });

        return this;
    };

    CimeosList.prototype.bindArrowPopin = async function () {

        let $this = this;

        $('.next').on('click', async function () {
            $(document).trigger("popinChange");

            $this.displayLoader();

            let items = $('#zone_results').find('article');
            let nextIndex = $this.currentIndexPopin + 1;

            if ($this.totalRecords > items.length && nextIndex >= items.length) {
                await $this.scroll();
            }

            items = $('#zone_results').find('article');

            let next = $(items[nextIndex]);

            if (!next.length) {
                nextIndex = 0;
                next = $(items[nextIndex]);
            }

            $this.currentIndexPopin = nextIndex;

            let contentElementId = next.attr('data-content-element-id');
            let uid = next.attr('data-uid');
            let title = next.attr('data-title');
            let url = next.find("a").attr('data-href');
            let popinId = next.attr('data-popin-id');

            $this.removeLoader();

            $this.displayPopin(contentElementId, uid, title, url, popinId);
        });

        $('.prev').on('click', function () {
            $(document).trigger("popinChange");

            let items = $('#zone_results').find('article');
            let prevIndex = $this.currentIndexPopin - 1;

            if (prevIndex < 0) {
                prevIndex = 0;
            }

            let prev = $(items[prevIndex]);

            $this.currentIndexPopin = prevIndex;

            let contentElementId = prev.attr('data-content-element-id');
            let uid = prev.attr('data-uid');
            let title = prev.attr('data-title');
            let url = prev.find("a").attr('data-href');
            let popinId = prev.attr('data-popin-id');

            $this.displayPopin(contentElementId, uid, title, url, popinId);
        });
    };

    CimeosList.prototype.lazy = function () {
        let images = document.querySelectorAll('img.lazy');
        let observer = new Hunt(images, {
            enter: function (image) {
                image.src = image.dataset.src;
            }
        });
    };

    CimeosList.prototype.bindPopin = function () {
        let $this = this;

        let items = $('.list_item:not(.no_popin)');

        items.off('click', 'a', $this.doBind);
        items.off('keypress', 'a', $this.doBind);

        items.on('click', 'a', {self: $this}, $this.doBind);
        items.on('keypress', 'a', {self: $this}, $this.doBind);

        //Foundation.reInit($this.activePopin);
    };

    CimeosList.prototype.doBind = function (e) {
        let $this = e.data.self;

        if (!$(this).parent().hasClass('no_popin')) {
            e.preventDefault();
            let parent = $(this).closest('.list_item');

            $this.currentItemListPopin = parent;

            let contentElementId = parent.attr('data-content-element-id');
            let uid = parent.attr('data-uid');
            let index = $('#zone_results').find('article').index(parent);
            let title = parent.attr('data-title');
            let url = parent.find("a").attr('data-href');
            let popinId = parent.attr('data-popin-id');

            $this.displayPopin(contentElementId, uid, title, url, popinId);
            $this.currentIndexPopin = index;

            return false;
        }
    };

    CimeosList.prototype.bindClosePopin = function () {

        let $this = this;

        $('.popin_list').on('closed.zf.reveal', function (e) {

            let target = $(e.target);

            if (target.hasClass('image_pop')) {
                return;
            }

            let popin = $(this);
            let wrap = popin.find('.wrap_popin');
            let mustPopstate = popin.attr('data-popstate');

            wrap.find('*').off();
            wrap.html('');

            if (parseInt(mustPopstate) === 1) {
                window.history.pushState({'url': $this.href}, '', $this.href);
            }

            if ($this.currentItemListPopin !== null) {
                $this.currentItemListPopin.find('a').focus();
            }

            popin.attr('data-popstate', 1);
        });
    };

    CimeosList.prototype.bindPopstate = function () {
        let $this = this;

        $(window).on('popstate', function (e) {
            let state = e.originalEvent.state;

            if (state !== null
                && typeof state.contentElementId !== 'undefined'
                && typeof state.uid !== 'undefined'
                && typeof state.title !== 'undefined'
                && typeof state.url !== 'undefined'
            ) {
                $this.displayPopin(state.contentElementId, state.uid, state.title, state.url, false, false);
            } else {
                let popin = $('#popin_detail');
                popin.attr('data-popstate', 0);
                popin.foundation('close');
            }
        });
    };

    CimeosList.prototype.bindForm = function () {
        let $this = this;

        this.forms.find('input[type="submit"]').on('click', function (e) {
            e.preventDefault();
            if ($('#popin_filters.reveal').length > 0) {
                $('#popin_filters').foundation('close');
            }
            if($("#btn_filtrer_rwd").is(":visible")) {
                $("#filters").foundation('toggle');
            }
            $this.triggerUpdate(e);
        });

        this.forms.submit(function (e) {
            e.preventDefault();
            if ($('#popin_filters.reveal').length > 0) {
                $('#popin_filters').foundation('close');
            }
            $this.triggerUpdate(e);
        });

        if ($this.config.autoSend) {
            $this.forms.find("input[type=checkbox], input[type=radio], select, #geo_nearme_field").change(function () {

                $this.currentAggs = $(this).closest('[data-aggs]').attr('data-agg-name');
                $this.currentAggItemKey = $(this).closest('div').attr('data-agg-item-key');
                $this.currentAggItemInput = $(this);

                $this.triggerUpdate({
                    auto: true,
                    target: $(this).closest('form'),
                });
            });

            $this.forms.find('input.custom-combobox-input').on('autocompleteselect', function (event, ui) {
                $this.triggerUpdate({
                    auto: true,
                    target: $(this).closest('form'),
                });
            });

            $this.forms.find('input[type="text"]').on('keyup', function () {
                $this.triggerUpdate({
                    auto: true,
                    target: $(this).closest('form'),
                });
            });

            $this.forms.find("button.filter").click(function () {
                $this.triggerUpdate({
                    auto: true,
                    target: $(this).closest('form'),
                });
            });
        }

        this.forms.find("#aspire :checkbox").on('change', function (e) {
            $this.triggerUpdate(e);
        });

        this.forms.find('.icheckbox input').on('ifChanged', function (e) {
            $this.triggerUpdate(e);
        });

        this.forms.find(".dp1").on('changeDate', function (e) {
            $this.triggerUpdate(e);
        });

        this.forms.find("#calendar").on('changeDate', function (e) {
            $this.forms.find("#date_from").val(moment(e.date).format('DD/MM/YYYY'));
            $this.forms.find("#date_to").val(moment(e.date).format('DD/MM/YYYY'));
            $this.triggerUpdate(e);
        });

        $(this).on('updateForm', $this.computeActiveFilters);
        $(this).on('updateForm', $this.updateResults);
        $(this).on('updateForm', $this.loadMarkers);
    };

    CimeosList.prototype.triggerUpdate = function (e) {
        if (this.useAjax === true) {
            let $this = this;
            if (e.auto === undefined) {
                e.preventDefault();
            }

            $this.trigger = 'form';
            $this.activeForm = $(e.target).closest('form');
            $this.data = $this.activeForm.serializeArray();
            $this.showResetBtnDependingOnActiveFilters();
            $this.computeActiveKeywordFilters();
            $this.computeActiveFilters();

            if ($this.isInteractiveMap && $this.activeFilters.html() === "") {
                $this.resetForm();
            } else {
                $this.updateDataForm(true);
            }
        }
    };

    CimeosList.prototype.bindResetForm = function () {
        let $this = this;
        $('.btn_reset, .reinit').on('click', function (e) {
            e.preventDefault();

            // close popin filters
            /*if ($('#popin_filters.reveal').length > 0) {
                $('#popin_filters').foundation('close');
            }*/

            $this.activeForm = $('#moteur').find('form');

            if ($this.isInteractiveMap) {
                $this.activeForm = $('#filters').find('form');
            }

            if (!$this.useAjax) {
                $this.activeForm = $('#searchEngineForm');
            }

            $this.resetForm();

            if (!$this.useAjax) {
                $this.activeForm.submit();
            }
        });
    };

    CimeosList.prototype.resetForm = function () {
        let $this = this;

        let form = $this.activeForm.get(0);
        form.reset();

        $(form).find('.checked').removeClass('checked');
        $(form).find(':checked').prop('checked', false);
        $(form).find('.date').addClass('is-hidden');
        $(form).find('input[type="text"]').val('');
        $(form).find('button[data-toggle]').removeClass('btn_act');
        $(form).find('fieldset').each(function () {
            let $radioButtons = $(this).find('input[type=radio]');
            $radioButtons.prop('checked', false); // uncheck all
            $radioButtons.eq(0).prop('checked', true); // check first
        });
        $(form).find('select').prop("selectedIndex", 0);
        $(form).find("input[type=hidden]").not("input[name=\"tx_cimsearchelastic_displaysearch[content_element_id]\"]").val('');

        // empty the results list from items
        ($this.isMasonry ? $this.masonryContainer : $("#zone_results"))
            .find('article')
            .remove();

        $("#tag").removeClass('open_date');
        $("#period_agenda").val($("#period_agenda option:first").val());

        // hide masonry and show top results
        if ($this.isTopResults) {
            $this.topResultsContainer.removeClass('hide');
        }

        /*if ($this.useAjax) {
            $this.activeForm = $('<form>');
        }*/

        if ($this.isInteractiveMap) {
            $(".nb_result_container").addClass('is-hidden');
            $("#result_carto_display").addClass('is-hidden');
            $('#result_carto_display_reinit').removeClass('is-hidden');
            $("#switch_display").addClass('is-hidden');
            $('#legende_carto li').removeClass('filtered');

            $this.closeAllPopup();
            $this.map.clearAll();
            $this.aggs.show();
            $this.aggs.find("[data-agg-item-key]").each(function () {
                let count = $(this).attr("data-initial-count");
                $(this).find('.count').text(count);
                $(this).show();
            });
            $this.moreAggsButton.show();
            //$this.aggs.filter('[data-agg-name="categories.title.keyword"]').hide();

            $this.computeActiveFilters();
            $this.showResetBtnDependingOnActiveFilters();
        } else {
            setTimeout(function () {
                $this.updateDataForm(true);
                $this.showResetBtnDependingOnActiveFilters();
                $this.computeActiveKeywordFilters();
            }, 10);
        }
    };

    CimeosList.prototype.updateDataForm = function (updateFormAfter) {
        let $this = this;

        $this.data = $this.activeForm.serializeArray();

        if (updateFormAfter) {
            $(this).trigger('updateForm');
        }
    };

    CimeosList.prototype.updateResults = function () {

        let $this = this;

        $('#switch_display').removeClass('is-hidden');
        $('#searchLoader').removeClass('hide');
        $this.showResetBtnDependingOnActiveFilters();

        if ($this.isMasonry) {
            let elements = $this.masonryContainer.masonry('getItemElements');
            $this.masonryContainer
                .masonry('remove', elements)
                .masonry('layout');
        } else {
            if ($('#list_items').hasClass('slick-slider')) {
                $('#list_items').slick('slickRemove');
            }
            $('#zone_results').find('article, ul.accordion > li, h2').not('#more_results_append').remove();
        }

        $('.no_result').addClass('hide');

        let data = $this.data.slice(0);
        data.push({name: 'tx_cimsearchelastic_displaysearch[page]', value: 0});
        if ($this.config.templateScroll !== undefined) {
            data.push({
                name: 'tx_cimsearchelastic_displaysearch[templateRootPath]',
                value: $this.config.templateScroll,
            });
        }

        if ($this.ajaxUpdate != null) {
            $this.ajaxUpdate.abort();
            $this.ajaxUpdate = null;
        }

        if ($this.isGlossary) {
            $('.letter-title').addClass('hide');
            $('.letter-accordion').addClass('hide');
            $('.letter-filter a').addClass('hide');
            $('.letter-filter span').removeClass('hide');
        }

        if($this.timeOut != null)
        {
            clearTimeout($this.timeOut);
            $this.timeOut = null;
        }

        $this.timeOut = setTimeout(function(){
            $this.ajaxUpdate = $.ajax({
                url: $this.config.urlScroll,
                type: 'POST',
                data: data,
            }).done(function (data) {
                $this.ajaxUpdate = null;

                if ($this.isGlossary) {
                    $this.updateResultsGlossary(data);
                    return;
                }

                let nbResults = data.nb_results;

                $this.config.totalRecords = nbResults;


                if ($this.isTopResults && $this.hasActiveFilters()) {
                    $this.topResultsContainer.addClass('hide');
                }

                if (data.content !== undefined && data.content.length > 1) {

                    let $content = $(data.content);

                    let tabs = $('#zone_filters .tabs li');
                    if ('categories' === $this.trigger) {
                        tabs.each(function () {
                            let tab = $(this);
                            let name = tab.attr('data-type');
                            if (data.types.indexOf(name) === -1) {
                                tab.addClass('disabled');
                            } else {
                                tab.removeClass('disabled');
                            }
                        });
                    }

                    if ($this.isMasonry) {
                        let elements = $content.filter('article');
                        if (!$this.hasActiveFilters() && !data.useNearmeFilter) {
                            elements = elements.slice(0, 6);
                        }
                        $this.masonryContainer.prepend(elements);
                        $this.masonryContainer
                            .masonry('prepended', elements)
                            .masonry('layout');
                    } else if ($('#list_items').hasClass('slick-slider')) {
                        $('#list_items').slick('slickAdd', $content)
                    } else {
                        $('#more_results_append').before($content);
                    }

                    $('#searchLoader').addClass('hide');

                    $this.page = 1;
                    $this.shouldLoad = true;

                    if ($('.accordion').length) {
                        Foundation.reInit($('[data-accordion]'));
                    }
                    if ($('#second_display .sticky').length) {
                        $('#second_display .sticky').foundation("_calc", true);
                        Foundation.reInit($('#second_display .sticky'));
                    }

                    $this.bindPopin();
                    $this.computeItemsState();
                    $this.lazy();

                    if ($this.config.updateAggs) {
                        $this.updateAggs(data.aggs);
                    }

                    if (typeof timerFunctionListSearch !== 'undefined') {
                        timerFunctionListSearch();
                    }

                } else {
                    $('#searchLoader').addClass('hide');
                    $this.shouldLoad = false;
                }


                let resultContainer = $('.nb_result');
                let resultNumber = resultContainer.find('span.nb_number');
                let resultText = resultContainer.find('span.nb_text');
                let resultTxtSingle = resultText.attr('data-text-single');
                let resultTxtMultiple = resultText.attr('data-text-multiple');

                resultNumber.text(nbResults);

                if (nbResults > 1) {
                    resultText.text(resultTxtMultiple);
                } else {
                    resultText.text(resultTxtSingle);
                }


                if (nbResults === 0) {
                    $('.no_result').removeClass('hide');
                }

                resultContainer.removeClass('is-hidden');


                $("#result_carto_display").removeClass('is-hidden');
                $('#result_carto_display_reinit').addClass('is-hidden');

            });
        }, 300);

        return this;
    };

    CimeosList.prototype.updateResultsGlossary = function (data) {
        let $this = this;

        // inject results
        let $articles = $(data.content).filter('article');
        if (data.documents.glossaire !== undefined) {
            for (let i = 0; i < data.documents.glossaire.length; i++) {
                let firstLetter = data.documents.glossaire[i].firstLetter.toLowerCase();

                // show h3
                $('#' + firstLetter).removeClass('hide');

                // show accordion + append result
                $('#' + firstLetter + '-content')
                    .removeClass('hide')
                    .append($articles.eq(i));

                // show filter
                $('.letter-filter-' + firstLetter + ' a').removeClass('hide');
                $('.letter-filter-' + firstLetter + ' span').addClass('hide');
            }
        }

        $this.updateNbResults(data.nb_results);

        Foundation.reInit($('[data-accordion]'));
        if ($('#second_display .sticky').length) {
            $('#second_display .sticky').foundation("_calc", true);
            Foundation.reInit($('#second_display .sticky'));
        }
        $('#searchLoader').addClass('hide');
    };

    CimeosList.prototype.updateNbResults = function (nbResults) {
        let resultTxt = "résultat";

        if (nbResults === 0) {

            $('.nb_result').addClass('is-hidden');
            $('.no_result').removeClass('hide');

        } else {

            $('.nb_result .result_number').text(nbResults);
            if (nbResults > 1) {
                resultTxt += 's';
            }
            $('.nb_result .result_text').text(resultTxt);
            $('.nb_result').removeClass('is-hidden');

            $('.no_result').addClass('hide');
        }

    };

    CimeosList.prototype.displayPopin = function (contentElementId, uid, title, url, popinId, pushState = true) {

        this.displayLoader();

        let $this = this;
        let popin = (typeof popinId !== 'undefined' && popinId.length > 0) ? $('#' + popinId) : $('#popin_detail');

        $('#event_to_subscribe').val(uid);

        $this.activePopin = popin;

        // Si popin spécifique si association
        // let popin = isAssociation ? $('#popin_detail_association') : $('#popin_detail');

        popin.attr('data-title', title);
        popin.attr('data-url', url);

        let label = popin.attr('data-ariaLabel');
        label = label + " " + title;
        popin.attr('aria-label', label);

        let $wrap = popin.find('.wrap_popin');

        let data = [];
        data.push({name: 'tx_cimsearchelastic_displaysearch[contentElementId]', value: contentElementId});
        data.push({name: 'tx_cimsearchelastic_displaysearch[itemUid]', value: uid});

        $.ajax({
            url: $this.config.urlShow,
            type: 'POST',
            dataType: 'json',
            data: data,
            success: function (data, textStatus, xhr) {
                $wrap.empty();

                $this.includeFiles(data.styles, 'css', $wrap);
                $wrap.append(data.html);
                $this.includeFiles(data.scripts, 'js', $wrap);

                $this.bindArrowPopin();

                if ($this.config.totalRecords === 1) {
                    $('.prev,.next').hide();
                }

                if ($this.currentIndexPopin === 0) {
                    $('.prev').hide();
                }

                $this.removeLoader();

                popin.foundation();
                popin.foundation('open');

                $this.lazy();

                setTimeout(function () {
                    if (typeof (tarteaucitron) !== 'undefined') {
                        tarteaucitron.job.forEach(function (e) {
                            tarteaucitron.job.push(e)
                        });
                    }
                }, 150);

                if (pushState) {
                    popin.attr('data-popstate', 1);
                    window.history.pushState({
                        'contentElementId': contentElementId,
                        'uid': uid,
                        'title': title,
                        'url': url
                    }, title, url);
                }

                $(document).trigger('popin');
            },
            complete: function (xhr, textStatus) {
                if (xhr.status === 500) {

                    let html = $('#popin_error').html();

                    $wrap.html(html);

                    $this.removeLoader();

                    popin.foundation();
                    popin.foundation('open');

                    $this.lazy();

                    if (pushState) {
                        popin.attr('data-popstate', 1);
                        window.history.pushState({
                            'contentElementId': contentElementId,
                            'uid': uid,
                            'title': title,
                            'url': url
                        }, title, url);
                    }

                    $(document).trigger('popin');
                }
            }
        });
    };

    CimeosList.prototype.includeFiles = function (files, type, $parent) {

        let excludeAttributes = [/*'media', 'onload'*/];

        $.each(files, function (key, fileInfos) {
            let $el;

            if (type === 'js') {
                $el = $("<script>");
                $el.attr('src', fileInfos.source);
            } else {
                $el = $("<link>");
                $el.attr('href', fileInfos.source);
                $el.attr('type', 'text/css');
            }

            // attributes
            $.each(fileInfos.attributes, function (attr, value) {
                if (!excludeAttributes.includes(attr)) {
                    $el.attr(attr, value);
                }
            });

            $el.appendTo($parent);
        });

    };

    CimeosList.prototype.computeActiveFilters = function () {
        let $this = this;

        this.activeFilters.html('');

        if (!$this.useAjax) {
            $this.activeForm = $('#searchEngineForm');
        }

        $this.computeActiveInputsFilters();
        $this.computeActiveSelectsFilters();
        $this.computeActiveCheckboxesFilters();
        $this.computeActiveRadioButtonsFilters();
        $this.computeActiveCalendarFilters();
        $this.computeActiveGeolocFilters();

        if ($this.activeFilters.html() !== '') {
            $('#active_filters').removeClass('is-hidden');
        } else {
            $('#active_filters').addClass('is-hidden');
            $this.currentAggs = null;
        }
    };

    CimeosList.prototype.computeActiveKeywordFilters = function () {
        let $this = this;

        let input = this.activeForm.find('input[type="text"].keyword').get(0);
        let container = $('.searched_word');

        if (input) {
            let value = $(input).val();

            if (value) {

                let containerValue = container.find('span');

                containerValue.text(value);
                container.removeClass('hide');

                return;
            }
        }

        container.addClass('hide');
    };

    CimeosList.prototype.computeActiveInputsFilters = function () {
        let $this = this;

        let inputs = this.activeForm.find('input[type="text"]').not('.dp1');

        $.each(inputs, function (i, input) {
            if ($(input).val() !== '') {
                let label = $('<span>').addClass('label_content').text($(input).prev('label').text() + ' : ');
                let value = $('<span>').addClass('field_content').text($(input).val());
                let html = $('<p>').append(label).append(value);
                $this.activeFilters.append(html);
            }
        });
    };

    CimeosList.prototype.computeActiveCheckboxesFilters = function () {
        let $this = this;

        let $activeCheckboxes = $this.activeForm.find('input[type="checkbox"]:checked');
        let activeFieldsetCheckbox = {};

        $.each($activeCheckboxes, function (i, input) {
            let id = $(input).closest('fieldset').attr('id');

            if (typeof activeFieldsetCheckbox[id] === 'undefined') {
                activeFieldsetCheckbox[id] = [];
            }

            activeFieldsetCheckbox[id].push(input);
        });

        $.each(activeFieldsetCheckbox, function (fieldsetId, inputs) {
            let fieldsetLabel = $('#' + fieldsetId).find('legend').text();
            let label = $('<span>').addClass('label_content').text(fieldsetLabel + ' : ');
            let html = $('<p>');
            html.append(label);

            $.each(inputs, function (i, input) {
                let value = $('<span>').addClass('field_content tag').text($(input).next('label').first().contents().filter(function () {
                    return this.nodeType == 3;
                }).text());

                html.append(value);
            });

            $this.activeFilters.append(html);
        });
    };

    CimeosList.prototype.computeActiveSelectsFilters = function () {
        let $this = this;
        let activeSelects = this.activeForm.find('select option[value!="default"][value!=""]:selected');

        $.each(activeSelects, function (i, input) {
            let label = $('<span>').addClass('label_content').text($(input).closest('select').prev('label').text() + ' : ');
            let valueText;

            if ($(input).val() === 'period') {
                let startdate = $('#date_from').val();
                let enddate = $('#date_to').val();

                valueText = $this.formatPeriod(startdate, enddate);

            } else {
                valueText = $(input).text();
            }

            let value = $('<span>').addClass('field_content').text(valueText);

            let html = $('<p>').append(label).append(value);
            $this.activeFilters.append(html);
        });
    };

    CimeosList.prototype.formatPeriod = function (startdate, enddate) {
        let valueText;

        if (startdate === enddate) {
            valueText = "Le " + startdate;
        }

        if (startdate !== '' && enddate === '') {
            valueText = "À partir du " + startdate;
        }

        if (startdate === '' && enddate !== '') {
            valueText = "Jusqu'au " + enddate;
        }

        if (startdate !== '' && enddate !== '' && startdate !== enddate) {
            valueText = "Du " + startdate + " au " + enddate;
        }

        return valueText;
    };

    CimeosList.prototype.computeActiveCalendarFilters = function () {
        let $this = this;
        let startdate = $('#date_from').val();
        let enddate = $('#date_to').val();

        if (startdate || enddate) {
            let label = $('<span>').addClass('label_content').text('Date : ');
            let valueText = $this.formatPeriod(startdate, enddate);

            let value = $('<span>').addClass('field_content').text(valueText);

            let html = $('<p>').append(label).append(value);
            $this.activeFilters.append(html);
        }

    };

    CimeosList.prototype.computeActiveRadioButtonsFilters = function () {
        let $this = this;

        let $activeRadios = $this.activeForm.find('input[type="radio"][value!="default"][value!=""]:checked');
        let activeFieldsetRadio = {};

        $.each($activeRadios, function (i, input) {
            let id = $(input).closest('fieldset').attr('id');

            if (typeof activeFieldsetRadio[id] === 'undefined') {
                activeFieldsetRadio[id] = [];
            }

            activeFieldsetRadio[id].push(input);
        });

        $.each(activeFieldsetRadio, function (fieldsetId, inputs) {
            let fieldsetLabel = $('#' + fieldsetId).find('legend').text();
            let label = $('<span>').addClass('label_content').text(fieldsetLabel + ' : ');
            let html = $('<p>');
            html.append(label);

            $.each(inputs, function (i, input) {
                let value = $('<span>').addClass('field_content tag').text($(input).next('label').first().contents().filter(function () {
                    return this.nodeType == 3;
                }).text());
                html.append(value);
            });

            $this.activeFilters.append(html);
        });
    };

    CimeosList.prototype.computeActiveGeolocFilters = function () {
        let $this = this;

        let $geolocField = $this.activeForm.find('#geo_nearme_field[value="1"]');
        if ($geolocField.eq(0).val() === '1') {
            let label = $('<span>').addClass('label_content').text('Autour de moi : ');
            let value = $('<span>').addClass('field_content').text(($geolocField.eq(0).val() === '1' ? 'Oui' : 'Non'));
            let html = $('<p>').append(label).append(value);
            $this.activeFilters.append(html);
        }
    };

    CimeosList.prototype.closeAllPopup = function () {
        $(".mapboxgl-popup-close-button").trigger('click');
    };

    CimeosList.prototype.displayLoader = function () {
        if (!this.isLoaderActive) {
            this.isLoaderActive = true;
            $('body').prepend('<div class="reveal-overlay load-popin"><div class="sk-circle"><div class="sk-circle1 sk-child"></div><div class="sk-circle2 sk-child"></div><div class="sk-circle3 sk-child"></div><div class="sk-circle4 sk-child"></div><div class="sk-circle5 sk-child"></div><div class="sk-circle6 sk-child"></div><div class="sk-circle7 sk-child"></div><div class="sk-circle8 sk-child"></div><div class="sk-circle9 sk-child"></div><div class="sk-circle10 sk-child"></div><div class="sk-circle11 sk-child"></div><div class="sk-circle12 sk-child"></div></div></div>');
        }
    };


    CimeosList.prototype.removeLoader = function () {
        $(".reveal-overlay.load-popin").remove();
        this.isLoaderActive = false;
    };

    CimeosList.prototype.masonryContainerActive = function () {
        let $this = this;

        if (!$this.isMasonry)
            return false;

        if ($this.masonryContainer.is(':visible')) {
            return true;
        }

        return false;
    };

    CimeosList.prototype.hasActiveFilters = function () {
        return (this.activeFilters.text().trim().length > 0);
    };

    CimeosList.prototype.showResetBtnDependingOnActiveFilters = function () {

        $(".btn_reset, .reinit").addClass('hide');

        if (this.hasActiveFilters()) {
            $(".btn_reset, .reinit").removeClass('hide');
        }
    };

    CimeosList.prototype.parseQuery = function (queryString) {
        var query = {};
        var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return query;
    }

    CimeosList.prototype.hasMap = function () {
        return ($('#' + this.config.idMap).length === 1);
    };

    CimeosList.prototype.getArgs = function () {
        return this.args;
    };

    CimeosList.prototype.setArgs = function (args) {
        return (this.args = args);
    };

    CimeosList.prototype.getConfig = function (element) {
        return this.args;
    };

    var cimeosList = function (args) {
        return new CimeosList(args);
    };

    global.cimeosList = cimeosList;

})
(this);