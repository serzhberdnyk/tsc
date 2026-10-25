// Derived from the retained research registry; this declares no network permission.
export const sourceCatalog=Object.freeze([
  {
    "id": "b2b_own",
    "runtime_source_id": "b2b",
    "family_id": "b2b_center",
    "name": "B2B-Center: собственные процедуры ЭТП",
    "country": "RU",
    "group": "etp_own",
    "role": "primary",
    "url": "https://www.b2b-center.ru/market/",
    "adapter_id": null,
    "research": {
      "checked_at": "2026-10-16T13:30:00Z",
      "state": "web_readable_listing",
      "runtime_live_verified": false,
      "limitations": [
        "Do not use /search as primary-only feed; it can include EIS/third-party aggregation.",
        "Corporate API exists; free anonymous bulk API not established."
      ],
      "requirement": "best_first_smoke_test"
    }
  },
  {
    "id": "bidzaar_own",
    "runtime_source_id": "bidzaar",
    "family_id": "bidzaar",
    "name": "Bidzaar: собственные коммерческие закупки",
    "country": "RU",
    "group": "etp_own",
    "role": "primary",
    "url": "https://bidzaar.com/app/requests/public/buy",
    "adapter_id": "bidzaar",
    "research": {
      "checked_at": "2026-10-16T13:30:00Z",
      "state": "web_readable_listing_shell",
      "runtime_live_verified": false,
      "limitations": [
        "Separate 'Все закупки Bidzaar' from 'Все закупки России' aggregator.",
        "Search-index and web-open snapshots contradicted each other for code 373-264; never infer live-open state from search cache."
      ],
      "requirement": "first_batch_runtime_test"
    }
  },
  {
    "id": "roza_khutor_bidzaar",
    "runtime_source_id": "bidzaar",
    "family_id": "bidzaar",
    "name": "Роза Хутор: собственная витрина заказчика Bidzaar",
    "country": "RU",
    "group": "etp_own",
    "role": "view",
    "url": "https://bidzaar.com/app/companies/tendery/ooo-roza-khutor-008-8462",
    "adapter_id": "bidzaar",
    "research": {
      "checked_at": "2026-10-16T13:30:00Z",
      "state": "web_readable_buyer_feed",
      "runtime_live_verified": false,
      "limitations": [
        "Do not list the Christmas fence procedure as accepting bids.",
        "Displayed times have no explicitly verified timezone in the returned page."
      ],
      "requirement": "first_batch_runtime_test"
    }
  },
  {
    "id": "magnit_b2b",
    "runtime_source_id": "magnit",
    "family_id": "b2b_center",
    "name": "Магнит / АО Тандер: некоммерческие закупки",
    "country": "RU",
    "group": "customer_portal",
    "role": "routing",
    "depends_on": "b2b",
    "url": "https://b2b.magnit.ru/",
    "adapter_id": null,
    "research": {
      "checked_at": "2026-10-16T13:30:00Z",
      "state": "web_readable_official_routing_and_buyer_identity",
      "runtime_live_verified": false,
      "limitations": [
        "Filter place of performance, not buyer legal address in Krasnodar.",
        "Do not collect product-supply SRM or ad-inventory sales as RA fabrication opportunities."
      ],
      "requirement": "first_batch_runtime_test"
    }
  },
  {
    "id": "neometria",
    "runtime_source_id": "neometria",
    "family_id": "neometria_ast_alpha",
    "name": "Неометрия: портал взаимодействия с контрагентами",
    "country": "RU",
    "group": "customer_portal",
    "role": "primary",
    "url": "https://tender.neometria.ru/",
    "adapter_id": null,
    "research": {
      "checked_at": "2026-10-16T13:30:00Z",
      "state": "search_index_readable_direct_open_failed",
      "runtime_live_verified": false,
      "limitations": [
        "Never label index evidence live-verified.",
        "Keep existing HOLD until official detail and deadline can be read directly."
      ],
      "requirement": "high_value_but_blocked_pending_runtime_probe"
    }
  },
  {
    "id": "tochno",
    "runtime_source_id": "tochno",
    "family_id": "tochno",
    "name": "ТОЧНО: тендеры и платформа подрядчиков",
    "country": "RU",
    "group": "customer_portal",
    "role": "primary",
    "url": "https://tender.tochnogroup.ru/trades",
    "adapter_id": null,
    "research": {
      "checked_at": "2026-10-16T13:30:00Z",
      "state": "tender_portal_inaccessible_platform_js_shell",
      "runtime_live_verified": false,
      "limitations": [
        "Do not create account or obtain persistent access in collector.",
        "No verified API/RSS or current procedure list."
      ],
      "requirement": "blocked_or_requires_authorized_account"
    }
  },
  {
    "id": "dogma",
    "runtime_source_id": "dogma",
    "family_id": "dogma",
    "name": "ДОГМА: тендеры застройщика",
    "country": "RU",
    "group": "customer_portal",
    "role": "primary",
    "url": "https://dogma.ru/tenders",
    "adapter_id": null,
    "research": {
      "checked_at": "2026-10-16T13:30:00Z",
      "state": "web_readable_js_listing_shell",
      "runtime_live_verified": false,
      "limitations": [
        "Do not trust 'Текущий' label when deadline already passed.",
        "No supported public API or RSS established."
      ],
      "requirement": "first_batch_runtime_test"
    }
  },
  {
    "id": "ava_group",
    "runtime_source_id": "ava_group",
    "family_id": "ava_group",
    "name": "AVA Group: собственная ЭТП",
    "country": "RU",
    "group": "customer_portal",
    "role": "primary",
    "url": "https://tender.avagroup.ru/",
    "adapter_id": null,
    "research": {
      "checked_at": "2026-10-16T13:30:00Z",
      "state": "indexed_public_list_and_card_direct_timeout",
      "runtime_live_verified": false,
      "limitations": [
        "Historical example establishes category fit, not active bid.",
        "Preserve full ASP.NET query semantics; do not assume query includes open-only procedures."
      ],
      "requirement": "runtime_probe_pending"
    }
  },
  {
    "id": "mantera",
    "runtime_source_id": "mantera",
    "family_id": "mantera",
    "name": "Мантера: закупки курортов и гостиниц",
    "country": "RU",
    "group": "customer_portal",
    "role": "primary",
    "url": "https://zakupki.mantera.ru/",
    "adapter_id": null,
    "research": {
      "checked_at": "2026-10-16T13:30:00Z",
      "state": "js_loading_shell_and_indexed_login_gate",
      "runtime_live_verified": false,
      "limitations": [
        "Do not treat legacy mantera-purchases.ru as confirmed current feed.",
        "No login, registration, bypass or credentials setup authorized by this registry."
      ],
      "requirement": "blocked_pending_access_check"
    }
  },
  {
    "id": "usi",
    "runtime_source_id": "usi",
    "family_id": "usi",
    "name": "ЮгСтройИнвест / ЮСИ: официальный раздел тендеров",
    "country": "RU",
    "group": "customer_portal",
    "role": "routing",
    "url": "https://gk-usi.ru/tenders/",
    "adapter_id": null,
    "research": {
      "checked_at": "2026-10-16T13:30:00Z",
      "state": "web_readable_supplier_page_no_lot_feed",
      "runtime_live_verified": false,
      "limitations": [
        "Do not fabricate current opportunities from supplier-registration page.",
        "No submission or outreach authorized."
      ],
      "requirement": "routing_only"
    }
  },
  {
    "id": "sochi_municipal",
    "runtime_source_id": "sochi_municipal",
    "family_id": "eis",
    "name": "Муниципальные закупки Сочи",
    "country": "RU",
    "group": "government",
    "role": "routing",
    "url": "https://sochi.ru/munitsipalnye-zakupki/",
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "502",
      "runtime_live_verified": false,
      "limitations": [
        "502/timeout/CAPTCHA/login/JS shell never imply zero procedures",
        "A lead needs primary card ID, current status, deadline/timezone and execution location",
        "Dedupe EIS notice plus lot plus version; preserve local IDs and evidenced EIS links",
        "Catalogue, plans, archives, price consultations and ad permits are not active contract procurements",
        "No account or permanent token authorized"
      ],
      "requirement": "Public route confirmation; no independent flow counted.",
      "provenance": "Delegated government report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d. No current primary procurement card read; all leads HOLD. Named original ra_government_sources_expanded_2026-10-16.json not attached here; this preserves supplied report only.",
      "reported_evidence": "Reference route only"
    },
    "reported_urls": []
  },
  {
    "id": "rts_sochi_small",
    "runtime_source_id": "rts_sochi_small",
    "family_id": "rts_small",
    "name": "Малые закупки Сочи, РТС",
    "country": "RU",
    "group": "government",
    "role": "primary",
    "url": "https://sochi.rts-tender.ru/",
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Official customer regulation read; listing unavailable",
      "runtime_live_verified": false,
      "limitations": [
        "502/timeout/CAPTCHA/login/JS shell never imply zero procedures",
        "A lead needs primary card ID, current status, deadline/timezone and execution location",
        "Dedupe EIS notice plus lot plus version; preserve local IDs and evidenced EIS links",
        "Catalogue, plans, archives, price consultations and ad permits are not active contract procurements",
        "No account or permanent token authorized"
      ],
      "requirement": "Public list and one buyer-need card without login; distinguish supplier offers.",
      "provenance": "Delegated government report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d. No current primary procurement card read; all leads HOLD. Named original ra_government_sources_expanded_2026-10-16.json not attached here; this preserves supplied report only.",
      "reported_evidence": "Festival MUP regulation 2025-12-22 section 56.2.2 names route; 56.3 registration for participation; applies only to that MUP"
    },
    "reported_urls": [
      "https://www.festival-sochi.ru/wp-content/uploads/2025/12/%D0%9F%D0%BE%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5-%D0%BE-%D0%B7%D0%B0%D0%BA%D1%83%D0%BF%D0%BA%D0%B5-%D0%9C%D0%A3%D0%9F-%D0%B3.-%D0%A1%D0%BE%D1%87%D0%B8-%D0%9A%D0%97-%D0%A4%D0%B5%D1%81%D1%82%D0%B8%D0%B2%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9-%D0%BE%D1%82-22.12.2025.pdf"
    ]
  },
  {
    "id": "rts_krasnodar_small",
    "runtime_source_id": "rts_krasnodar_small",
    "family_id": "rts_small",
    "name": "Краевой магазин РТС",
    "country": "RU",
    "group": "government",
    "role": "primary",
    "url": "https://krd-market.rts-tender.ru/",
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Direct reading failed",
      "runtime_live_verified": false,
      "limitations": [
        "502/timeout/CAPTCHA/login/JS shell never imply zero procedures",
        "A lead needs primary card ID, current status, deadline/timezone and execution location",
        "Dedupe EIS notice plus lot plus version; preserve local IDs and evidenced EIS links",
        "Catalogue, plans, archives, price consultations and ad permits are not active contract procurements",
        "No account or permanent token authorized"
      ],
      "requirement": "Confirm official current route/regulation, then public list/card.",
      "provenance": "Delegated government report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d. No current primary procurement card read; all leads HOLD. Named original ra_government_sources_expanded_2026-10-16.json not attached here; this preserves supplied report only.",
      "reported_evidence": "Current primary regulation not obtained; still candidate"
    },
    "reported_urls": []
  },
  {
    "id": "eis",
    "runtime_source_id": "eis",
    "family_id": "eis",
    "name": "ЕИС",
    "country": "RU",
    "group": "government",
    "role": "primary",
    "url": "https://zakupki.gov.ru/epz/main/public/home.html",
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Browser 502 Connection refused; web timeout; technical failure, not explicit denial",
      "runtime_live_verified": false,
      "limitations": [
        "502/timeout/CAPTCHA/login/JS shell never imply zero procedures",
        "A lead needs primary card ID, current status, deadline/timezone and execution location",
        "Dedupe EIS notice plus lot plus version; preserve local IDs and evidenced EIS links",
        "Catalogue, plans, archives, price consultations and ad permits are not active contract procurements",
        "No account or permanent token authorized"
      ],
      "requirement": "Normal public site/docs reading allowed. Current 2026 schema/quotas/runtime unknown. No registration/token without approval.",
      "provenance": "Delegated government report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d. No current primary procurement card read; all leads HOLD. Named original ra_government_sources_expanded_2026-10-16.json not attached here; this preserves supplied report only.",
      "reported_evidence": "Official historical announcement: getDocsIP/getDocsLE, registration/ESIA, FTP closed 2025-01-01"
    },
    "reported_urls": [
      "https://zakupki.gov.ru/epz/opendata/search/results.html",
      "https://t.me/gis_eiszakupki/1954",
      "https://t.me/s/gis_eiszakupki?before=1973"
    ]
  },
  {
    "id": "tektorg",
    "runtime_source_id": "tektorg",
    "family_id": "tektorg",
    "name": "ТЭК-Торг: собственные процедуры и официальный API",
    "country": "RU",
    "group": "etp_own",
    "role": "primary",
    "url": "https://www.tektorg.ru/procedures",
    "adapter_id": null,
    "research": {
      "checked_at": "2026-10-16T13:30:00Z",
      "state": "official_api_document_indexed_runtime_unverified",
      "runtime_live_verified": false,
      "limitations": [
        "Some 'закупки крупнейших площадок' sections are aggregation; exclude when primary-only.",
        "Do not infer API reliability or entitlement from indexed documentation."
      ],
      "requirement": "runtime_probe_pending"
    }
  },
  {
    "id": "tender_pro",
    "runtime_source_id": "tender_pro",
    "family_id": "tender_pro",
    "name": "Tender.Pro",
    "country": "RU",
    "group": "etp_own",
    "role": "primary",
    "url": "https://www.tender.pro/",
    "url_role": "official_documentation",
    "urls": {
      "official": "https://www.tender.pro/",
      "search_help": "https://help.tender.pro/search_konkurs.html",
      "integration": "https://help.tender.pro/integraciya_api.html",
      "integration_overview": "https://system.help.tender.pro/integration.html"
    },
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Main 403; help readable; no bypass",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "_info.tenderlist_by_set, set_type_id=2; documentation 2026-10-02",
      "limitations": [
        "API access, authorization and terms are unverified.",
        "Do not call the API as an alternate route after the reported homepage 403.",
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P1 documented JSON; terms/auth/quotas unknown"
    },
    "reported_urls": [
      "https://www.tender.pro/",
      "https://help.tender.pro/vigruzka_lenti_procedur.html"
    ]
  },
  {
    "id": "etp_gpb",
    "runtime_source_id": "etp_gpb",
    "family_id": "etp_gpb",
    "name": "ЭТП ГПБ",
    "country": "RU",
    "group": "etp_own",
    "role": "primary",
    "url": "https://etpgpb.ru/procedures/",
    "url_role": "official_documentation",
    "urls": {
      "official": "https://etpgpb.ru/",
      "entry": "https://etpgpb.ru/procedures/",
      "commercial": "https://new.etpgpb.ru/products/business/",
      "commercial_description": "https://promo.etpgpb.ru/suppliers2/com",
      "search_help": "https://new.etpgpb.ru/help/articles/201-poisk_torgov/"
    },
    "feed_url": "https://etpgpb.ru/procedures.rss",
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Listing timeout; RSS inaccessible through research tool",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Official procedures to procedures.rss rule retaining filters; no free API promise",
      "limitations": [
        "Feed response, permitted use, pagination, freshness and regional coverage are unverified.",
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P1 documented RSS; new Business section coverage unverified"
    },
    "reported_urls": [
      "https://etpgpb.ru/procedures/",
      "https://new.etpgpb.ru/procedures/api/",
      "https://etpgpb.ru/procedures.rss"
    ]
  },
  {
    "id": "estp",
    "runtime_source_id": "estp",
    "family_id": "estp",
    "name": "ESTP",
    "country": "RU",
    "group": "etp_own",
    "role": "primary",
    "url": "https://comm.estp.ru/office/public/announces?type=comm",
    "url_role": "public_own_section_listing",
    "urls": {
      "official": "https://estp.ru/",
      "owner": "https://comm.estp.ru/office/requisites"
    },
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "HTML list readable; detail/documents unverified",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Own T IDs, buyers, October 2026 deadlines; operator INN 7701986754",
      "limitations": [
        "Snapshot count is not unique coverage.",
        "No public API/RSS or documents confirmed; candidate key family plus T procedure ID.",
        "Research observation is not an adapter test; a separate runtime probe report is retained if attempted.",
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P1 HTML plus rendered detail; no API/RSS confirmed"
    },
    "reported_urls": [
      "https://comm.estp.ru/office/public/announces?type=comm"
    ]
  },
  {
    "id": "mos_supplier_portal",
    "runtime_source_id": "mos_supplier_portal",
    "family_id": "mos_supplier_portal",
    "name": "Портал поставщиков Москвы",
    "country": "RU",
    "group": "government",
    "role": "primary",
    "url": "https://zakupki.mos.ru/",
    "url_role": "portal",
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Browser 502 Connection refused",
      "runtime_live_verified": false,
      "provenance": "Delegated government report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d. No current primary procurement card read; all leads HOLD. Named original ra_government_sources_expanded_2026-10-16.json not attached here; this preserves supplied report only.",
      "reported_evidence": "Official 2026-10-08 news names Krasnodar customers. 2026-02-05 API news covers STE product catalogue, not procurement notices; UPD API is document exchange",
      "limitations": [
        "502/timeout/CAPTCHA/login/JS shell never imply zero procedures",
        "A lead needs primary card ID, current status, deadline/timezone and execution location",
        "Dedupe EIS notice plus lot plus version; preserve local IDs and evidenced EIS links",
        "Catalogue, plans, archives, price consultations and ad permits are not active contract procurements",
        "No account or permanent token authorized"
      ],
      "requirement": "Public procurement list, execution-place filters and card; separately verify supported notice export."
    },
    "reported_urls": [
      "https://tender.mos.ru/news/kolichestvo-zakazchikov-na-portale-postavshchikov-prevysilo-65-tysyach/",
      "https://tender.mos.ru/news/novye-tsifrovye-resheniya-v-kataloge-portala-postavshchikov-uproshchayut-zakupki-dlya-biznesa/"
    ]
  },
  {
    "id": "eat",
    "runtime_source_id": "eat",
    "family_id": "eat",
    "name": "ЕАТ Берёзка",
    "country": "RU",
    "group": "government",
    "role": "primary",
    "url": "https://agregatoreat.ru/",
    "url_role": "pending_researcher_urls",
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "CAPTCHA; stopped",
      "runtime_live_verified": false,
      "provenance": "Delegated government report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d. No current primary procurement card read; all leads HOLD. Named original ra_government_sources_expanded_2026-10-16.json not attached here; this preserves supplied report only.",
      "reported_evidence": "Software rightsholder AO Berezka; operator AO EAT. Integration manual v2.37 changed 2023-03-02 requires organization token for every requestOrderList/orderNotification/orderProtocol request; 2026 compatibility unknown",
      "limitations": [
        "502/timeout/CAPTCHA/login/JS shell never imply zero procedures",
        "A lead needs primary card ID, current status, deadline/timezone and execution location",
        "Dedupe EIS notice plus lot plus version; preserve local IDs and evidenced EIS links",
        "Catalogue, plans, archives, price consultations and ad permits are not active contract procurements",
        "No account or permanent token authorized"
      ],
      "requirement": "Only open current specifications; no CAPTCHA bypass or token creation. Partner reposts are not own EAT sessions."
    },
    "reported_urls": [
      "https://berezka-tender.ru/",
      "https://berezka-tender.ru/documentation.html",
      "https://berezka-tender.ru/src/files/%D0%9A%D1%80%D0%B0%D1%82%D0%BA%D0%B0%D1%8F_%D0%B8%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BA%D1%86%D0%B8%D1%8F_%D0%B8%D0%BD%D1%82%D0%B5%D0%B3%D1%80%D0%B0%D1%86%D0%B8%D1%8F_%D0%95%D0%90%D0%A2_%D1%81_%D0%98%D0%A1.pdf"
    ]
  },
  {
    "id": "fabrikant_commercial",
    "runtime_source_id": "fabrikant_commercial",
    "family_id": "fabrikant",
    "name": "Фабрикант: коммерческие закупки",
    "country": "RU",
    "group": "etp_own",
    "role": "primary",
    "url": "https://www.fabrikant.ru/procedure/search/purchases?section_ids%5B%5D=2",
    "url_role": "own_commercial_section",
    "urls": {
      "official": "https://www.fabrikant.ru/",
      "owner": "https://www.fabrikant.ru/about/privacy-policy/",
      "documentation_example": "https://www.fabrikant.ru/v2/trades/procedure/documentation/Zu8VQOSdyNTh7fBpmeu9bQ"
    },
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Direct timeout; official July index only",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Procedure/lot IDs and organizer; exclude sales and stale status",
      "limitations": [
        "No current supported API/RSS confirmed.",
        "Only own procurement section, excluding sales and aggregation; participation/closed sections need login.",
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P2 own section 2; API/RSS unconfirmed"
    },
    "reported_urls": [
      "https://www.fabrikant.ru/procedure/search/purchases?section_ids%5B%5D=2"
    ]
  },
  {
    "id": "otc_own",
    "runtime_source_id": "otc_own",
    "family_id": "otc",
    "name": "ОТС-тендер: собственные процедуры",
    "country": "RU",
    "group": "etp_own",
    "role": "primary",
    "url": "https://tender.otc.ru/main/auction/",
    "url_role": "candidate_own_section",
    "urls": {
      "official": "https://otc.ru/",
      "manual": "https://otc.ru/portals/0/Files/Content/pdf/OTC-UserManual.pdf",
      "aggregator_excluded": "https://otc.ru/buy/"
    },
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Route inaccessible; official manual CAPTCHA; stopped",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "/buy includes external ETP aggregation",
      "limitations": [
        "CAPTCHA is a stop; no alternate route or login attempted.",
        "Do not use aggregator /buy/ as an own-source feed.",
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P2 canonical own feed unresolved; historical widget/API only"
    },
    "reported_urls": [
      "https://tender.otc.ru/main/auction/"
    ]
  },
  {
    "id": "sber_a_commercial",
    "runtime_source_id": "sber_a_commercial",
    "family_id": "sber_ast",
    "name": "Сбер А: коммерческие заказчики",
    "country": "RU",
    "group": "etp_own",
    "role": "primary",
    "url": "https://psi.sberbank-ast.ru/",
    "url_role": "candidate_own_section",
    "urls": {
      "official": "https://psi.sberbank-ast.ru/",
      "sections": "https://psi.sberbank-ast.ru/tariffs/TariffsList.html"
    },
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "JS shell; VIP route inaccessible",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Official tariff confirms commercial section; no lot read",
      "limitations": [
        "No supported public API/RSS confirmed.",
        "Participation requires registration/accreditation under section rules.",
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P2 current commercial route unresolved"
    },
    "reported_urls": [
      "https://psi.sberbank-ast.ru/"
    ]
  },
  {
    "id": "roseltorg_business",
    "runtime_source_id": "roseltorg_business",
    "family_id": "roseltorg",
    "name": "Росэлторг.Бизнес: собственная секция",
    "country": "RU",
    "group": "etp_own",
    "role": "primary",
    "url": "https://business.roseltorg.ru/",
    "url_role": "own_section",
    "urls": {
      "official": "https://www.roseltorg.ru/",
      "public_search": "https://www.roseltorg.ru/procedures/search",
      "manual": "https://www.roseltorg.ru/_flysystem/webdav/2024/12/06/rp_RB_06122024.pdf",
      "example": "https://www.roseltorg.ru/procedure/B1905251107374"
    },
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Direct error; official card/manual index only",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Historical B1905251107374",
      "limitations": [
        "Historical example is not a live lead.",
        "No supported API/RSS confirmed; invite-only procedures excluded.",
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P2 own Business section; exclude asset sales"
    },
    "reported_urls": [
      "https://business.roseltorg.ru/"
    ]
  },
  {
    "id": "onlinecontract_own",
    "runtime_source_id": "onlinecontract_own",
    "family_id": "onlinecontract",
    "name": "ONLINECONTRACT: корпоративные закупки",
    "country": "RU",
    "group": "etp_own",
    "role": "primary",
    "url": "https://onlinecontract.ru/",
    "url_role": "official_portal",
    "urls": {
      "help": "https://onlinecontract.ru/help",
      "documentation": "https://onlinecontract.ru/docs/649055293aff01b76fafb168"
    },
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Loading shell; official index readable",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Owner MX 1; free viewing offered after registration; no lot read",
      "limitations": [
        "Anonymous full list, details and procurement documents unverified.",
        "No supported API/RSS confirmed; do not register or purchase a licence.",
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P2 corporate purchasing; no API/RSS confirmed"
    },
    "reported_urls": [
      "https://onlinecontract.ru/"
    ]
  },
  {
    "id": "supl_direct_rfq",
    "runtime_source_id": "supl_direct_rfq",
    "family_id": "supl",
    "name": "Supl.biz: прямые RFQ-заявки (дополнительный канал)",
    "country": "RU",
    "group": "supplementary_rfq",
    "role": "primary",
    "url": "https://supl.biz/orders/?rubrics=1809",
    "url_role": "buyer_rfq_marketplace",
    "urls": {
      "official": "https://supl.biz/",
      "relevant_category": "https://supl.biz/orders/?rubrics=1809",
      "owner": "https://supl.biz/supl-biz-account-details/",
      "example": "https://supl.biz/orders/paketyi-bumazhnyie-dlya-snabzheniya-optovo-roznich-2265216/"
    },
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "HTML readable; latest 24h login-only; sample cache miss",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Advertising/printing category; Krasnodar order 2265216; contacts gated",
      "limitations": [
        "Keep delayed RFQ separate from formal tender coverage and three required source groups.",
        "No contact unlock/login or public API/RSS confirmed; supplier subdomains are not independent sources.",
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P2 delayed RFQ, not formal tenders"
    },
    "reported_urls": [
      "https://supl.biz/orders/?rubrics=1809"
    ]
  },
  {
    "id": "gk_nvm",
    "runtime_source_id": "gk_nvm",
    "family_id": "alfa2b",
    "name": "ГК НВМ",
    "country": "RU",
    "group": "customer_portal",
    "role": "primary",
    "url": "https://tender.gk-nvm.ru/",
    "reported_urls": [
      "https://tender.gk-nvm.ru/",
      "https://tender.gk-nvm.ru/site/view-tender?id=38"
    ],
    "adapter_id": "gk_nvm",
    "research": {
      "checked_at": null,
      "state": "HTML list/card readable; document tab error",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Card 38 entrance steelwork; expired and conflicting list/detail deadlines",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P1 shared parser candidate with Neometria; access per host"
    }
  },
  {
    "id": "alean_collection",
    "runtime_source_id": "bidzaar",
    "family_id": "bidzaar",
    "name": "Alean Collection",
    "country": "RU",
    "group": "customer_portal",
    "role": "view",
    "url": "https://bidzaar.com/app/companies/tendery/alean-collection-010-2708",
    "reported_urls": [
      "https://bidzaar.com/app/companies/tendery/alean-collection-010-2708"
    ],
    "adapter_id": "bidzaar",
    "inherited_from": "bidzaar_own",
    "depends_on": "bidzaar",
    "research": {
      "checked_at": null,
      "state": "List/card readable; XLSX metadata only",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "384-073 Anapa park figures; 23.10.2026 07:12 without verified timezone; HOLD",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P0 reuse Bidzaar; INN 7714619663; buy only"
    }
  },
  {
    "id": "585_zolotoy",
    "runtime_source_id": "bidzaar",
    "family_id": "bidzaar",
    "name": "585 Золотой",
    "country": "RU",
    "group": "customer_portal",
    "role": "view",
    "url": "https://bidzaar.com/app/companies/tendery/585-zolotoy-008-8499",
    "reported_urls": [
      "https://bidzaar.com/app/companies/tendery/585-zolotoy-008-8499"
    ],
    "adapter_id": "bidzaar",
    "inherited_from": "bidzaar_own",
    "depends_on": "bidzaar",
    "research": {
      "checked_at": null,
      "state": "Buyer/list/card readable",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "364-095 Krasnodar sign manufacture/install; historical",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P1 reuse Bidzaar; Regent Gold INN 7814566648"
    }
  },
  {
    "id": "rigla",
    "runtime_source_id": "bidzaar",
    "family_id": "bidzaar",
    "name": "Ригла",
    "country": "RU",
    "group": "customer_portal",
    "role": "view",
    "url": "https://bidzaar.com/app/companies/tendery/rigla-000-3254",
    "reported_urls": [
      "https://bidzaar.com/app/companies/tendery/rigla-000-3254"
    ],
    "adapter_id": "bidzaar",
    "inherited_from": "bidzaar_own",
    "depends_on": "bidzaar",
    "research": {
      "checked_at": null,
      "state": "Card readable; buyer corporate chain incomplete",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "311-563 Krasnodar branch signage/navigation, 104 lines; historical",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P1 verify buyer then reuse Bidzaar; INN 7724211288"
    }
  },
  {
    "id": "incity",
    "runtime_source_id": "incity",
    "family_id": "unconfirmed:incity",
    "name": "Инсити",
    "country": "RU",
    "group": "customer_portal",
    "role": "routing",
    "url": "https://tender.incitystroy.ru/",
    "reported_urls": [
      "https://tender.incitystroy.ru/"
    ],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Official route/manual readable; no lot",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "https://incitystroy.ru/tenders",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Disabled pending public feed; engine/API/RSS unknown"
    }
  },
  {
    "id": "family_yug",
    "runtime_source_id": "family_yug",
    "family_id": "unconfirmed:family_yug",
    "name": "Семья",
    "country": "RU",
    "group": "customer_portal",
    "role": "routing",
    "url": "https://tender.family-yug.ru/",
    "reported_urls": [
      "https://tender.family-yug.ru/"
    ],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Official route readable; portal loading shell",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "https://family-yug.ru/tendery/",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Disabled pending public feed"
    }
  },
  {
    "id": "development_yug",
    "runtime_source_id": "development_yug",
    "family_id": "unconfirmed:development_yug",
    "name": "Девелопмент-Юг",
    "country": "RU",
    "group": "customer_portal",
    "role": "routing",
    "url": "https://etp.develug.ru/public/tenders",
    "reported_urls": [
      "https://etp.develug.ru/public/tenders"
    ],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Official route readable; empty extraction",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "https://www.develug.ru/contractor",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Disabled pending public feed"
    }
  },
  {
    "id": "sibur",
    "runtime_source_id": "sibur",
    "family_id": "sibur_public_html",
    "name": "СИБУР",
    "country": "RU",
    "group": "customer_portal",
    "role": "primary",
    "url": "https://www.sibur.ru/ru/procurement/buy/",
    "reported_urls": [
      "https://www.sibur.ru/ru/procurement/buy/",
      "https://www.sibur.ru/upload/tmp/example/9a2/ly9wba5yjtimmdo1uwcub15ojftxp0ql.pdf"
    ],
    "adapter_id": "sibur",
    "research": {
      "checked_at": null,
      "state": "HTML list/archive and 8-page PDF read; IDs lead to SAP login",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "2144058/1 published 2026-10-16; advertising category filter, actual relevant lot unconfirmed",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "P1 public HTML/docs; no SAP login; API/RSS unconfirmed"
    }
  },
  {
    "id": "x5",
    "runtime_source_id": "b2b",
    "family_id": "b2b_center",
    "name": "X5",
    "country": "RU",
    "group": "customer_portal",
    "role": "view",
    "url": "https://x5.b2b-center.ru/",
    "reported_urls": [
      "https://x5.b2b-center.ru/"
    ],
    "adapter_id": null,
    "inherited_from": "b2b_own",
    "depends_on": "b2b",
    "research": {
      "checked_at": null,
      "state": "Official routing read; plan XLSX unsupported; no lot",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "https://x5.ru/ru/partners/purchases-for-own-needs/",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Reuse B2B; resolve buyer identities; existing B2B block applies"
    }
  },
  {
    "id": "lenta",
    "runtime_source_id": "lenta",
    "family_id": "lenta_candidate",
    "name": "Лента",
    "country": "RU",
    "group": "customer_portal",
    "role": "routing",
    "url": "https://portalnkz.lenta.com/",
    "reported_urls": [
      "https://portalnkz.lenta.com/"
    ],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Official route read; portal error",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Official noncommercial marketing/equipment/construction categories",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Disabled until public feed verified"
    }
  },
  {
    "id": "metro",
    "runtime_source_id": "metro",
    "family_id": "metro_candidate",
    "name": "METRO",
    "country": "RU",
    "group": "customer_portal",
    "role": "routing",
    "url": "https://metro-cc.ru/for-business/tenders/",
    "reported_urls": [
      "https://metro-cc.ru/for-business/tenders/"
    ],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Official supplier intake only; no structured feed",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Marketing/PR,MICE,construction; invitations by email",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Routing/intake only; no forms submitted"
    }
  },
  {
    "id": "eurochem",
    "runtime_source_id": "b2b",
    "family_id": "b2b_center",
    "name": "ЕвроХим",
    "country": "RU",
    "group": "customer_portal",
    "role": "view",
    "url": "https://zakupki.eurochem.ru/aktualnye-zakupki1",
    "reported_urls": [
      "https://zakupki.eurochem.ru/aktualnye-zakupki1"
    ],
    "adapter_id": null,
    "inherited_from": "b2b_own",
    "depends_on": "b2b",
    "research": {
      "checked_at": null,
      "state": "Official buyer HTML read; B2B card cache miss",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "4641400 deadline 22.10.2026; historical printing 4011118; region unknown",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Reuse B2B; corporate route optional; existing B2B block applies"
    }
  },
  {
    "id": "ozon",
    "runtime_source_id": "bidzaar",
    "family_id": "bidzaar",
    "name": "Ozon",
    "country": "RU",
    "group": "customer_portal",
    "role": "view",
    "url": "https://bidzaar.com/process/light/019a1074-7cd4-7dd0-bb66-09773197864b",
    "reported_urls": [
      "https://bidzaar.com/process/light/019a1074-7cd4-7dd0-bb66-09773197864b"
    ],
    "adapter_id": "bidzaar",
    "inherited_from": "bidzaar_own",
    "depends_on": "bidzaar",
    "research": {
      "checked_at": null,
      "state": "Primary card readable; document failed",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "261-625 PVZ branding for 2026; closed November 2025; region unknown",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Reuse Bidzaar; resolve buyer identity"
    }
  },
  {
    "id": "wildberries",
    "runtime_source_id": "bidzaar",
    "family_id": "bidzaar",
    "name": "Wildberries",
    "country": "RU",
    "group": "customer_portal",
    "role": "view",
    "url": "https://bidzaar.com/app/process/light/019ea6fa-d3b5-79da-a1b7-3d6cd8fdabe2",
    "reported_urls": [
      "https://bidzaar.com/app/process/light/019ea6fa-d3b5-79da-a1b7-3d6cd8fdabe2"
    ],
    "adapter_id": "bidzaar",
    "inherited_from": "bidzaar_own",
    "depends_on": "bidzaar",
    "research": {
      "checked_at": null,
      "state": "Primary card readable; docs failed; WB Service 498",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "339-596 PVZ repair nationwide; closed June 2026; advertising scope unknown",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Reuse Bidzaar; WB Service is not procurement feed"
    }
  },
  {
    "id": "phosagro",
    "runtime_source_id": "phosagro",
    "family_id": "phosagro_candidate",
    "name": "ФосАгро",
    "country": "RU",
    "group": "customer_portal",
    "role": "routing",
    "url": "https://www.phosagro.ru/procurement/",
    "reported_urls": [
      "https://www.phosagro.ru/procurement/"
    ],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Instructions read; active auctions in account",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Supplier application/ESG/account; no public lot",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Disabled; etpreg.phosagro.ru unverified"
    }
  },
  {
    "id": "severstal",
    "runtime_source_id": "severstal",
    "family_id": "severstal_candidate",
    "name": "Северсталь",
    "country": "RU",
    "group": "customer_portal",
    "role": "routing",
    "url": "https://suppliers.severstal.com/",
    "reported_urls": [
      "https://suppliers.severstal.com/"
    ],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Candidate pages errored",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Also procurement.severstal.com; no primary publication",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Disabled; owner/feed/API unverified"
    }
  },
  {
    "id": "agrocomplex",
    "runtime_source_id": "agrocomplex",
    "family_id": "agrocomplex_candidate",
    "name": "Агрокомплекс",
    "country": "RU",
    "group": "customer_portal",
    "role": "routing",
    "url": "https://atp.agrokomplex.ru/",
    "reported_urls": [
      "https://atp.agrokomplex.ru/"
    ],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Official agrkompleks.ru read; procurement unavailable",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "Regional owner established; no card",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Disabled; exact primary route unverified"
    }
  },
  {
    "id": "okey",
    "runtime_source_id": "okey",
    "family_id": "bidzaar_and_tenderpro",
    "name": "О’КЕЙ",
    "country": "RU",
    "group": "customer_portal",
    "role": "routing",
    "url": "https://www.okmarket.ru/partners/tenders/",
    "reported_urls": [
      "https://www.okmarket.ru/partners/tenders/"
    ],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Official routing read; JS rows unresolved",
      "runtime_live_verified": false,
      "provenance": "Full delegated commercial report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d; replaces preliminary commercial conclusions. Search/web observations may be cached; no runtime integration asserted.",
      "reported_evidence": "POS/printing/marketing/interiors categories; no current local lot",
      "limitations": [
        "No registration/token/login/bypass/CAPTCHA solving",
        "Buyer views reuse platform family",
        "Index/cache is not a live lead",
        "Expired or conflicting dates remain HOLD",
        "Honor robots/terms/quotas"
      ],
      "requirement": "Reuse Bidzaar/Tender.Pro after buyer IDs resolved; no API bypass"
    }
  },
  {
    "id": "rissz_krasnodar",
    "runtime_source_id": "rissz_krasnodar",
    "family_id": "eis",
    "name": "РИССЗ Краснодарского края",
    "country": "RU",
    "group": "government",
    "role": "routing",
    "url": "https://zakupki.krasnodar.ru/",
    "reported_urls": [
      "https://xn--80aebegqrmpavth1g.xn--p1ai/item/2284803"
    ],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Browser 502 Connection refused",
      "runtime_live_verified": false,
      "provenance": "Delegated government report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d. No current primary procurement card read; all leads HOLD. Named original ra_government_sources_expanded_2026-10-16.json not attached here; this preserves supplied report only.",
      "reported_evidence": "Official Timashevsk list row24: regional DRKS operates system and transmits 44-FZ notices to EIS",
      "limitations": [
        "502/timeout/CAPTCHA/login/JS shell never imply zero procedures",
        "A lead needs primary card ID, current status, deadline/timezone and execution location",
        "Dedupe EIS notice plus lot plus version; preserve local IDs and evidenced EIS links",
        "Catalogue, plans, archives, price consultations and ad permits are not active contract procurements",
        "No account or permanent token authorized"
      ],
      "requirement": "Public page/docs; no independent feed/API confirmed; EIS duplicates must not increase coverage."
    }
  },
  {
    "id": "sirius_official",
    "runtime_source_id": "sirius_official",
    "family_id": "eis",
    "name": "Сириус: официальное направление в ЕИС",
    "country": "RU",
    "group": "government",
    "role": "routing",
    "url": "https://sirius-ft.ru/inf_activities/",
    "reported_urls": [],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Official page read",
      "runtime_live_verified": false,
      "provenance": "Delegated government report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d. No current primary procurement card read; all leads HOLD. Named original ra_government_sources_expanded_2026-10-16.json not attached here; this preserves supplied report only.",
      "reported_evidence": "Territorial council procurement routed to EIS, no own feed",
      "limitations": [
        "502/timeout/CAPTCHA/login/JS shell never imply zero procedures",
        "A lead needs primary card ID, current status, deadline/timezone and execution location",
        "Dedupe EIS notice plus lot plus version; preserve local IDs and evidenced EIS links",
        "Catalogue, plans, archives, price consultations and ad permits are not active contract procurements",
        "No account or permanent token authorized"
      ],
      "requirement": "Keep Sirius as separate execution geography; do not rely solely on Krasnodar region filter."
    }
  },
  {
    "id": "torgi_ad_rights",
    "runtime_source_id": "torgi_ad_rights",
    "family_id": "gis_torgi",
    "name": "ГИС Торги: права на рекламные места",
    "country": "RU",
    "group": "advertising_rights",
    "role": "primary",
    "url": "https://torgi.gov.ru/",
    "reported_urls": [
      "https://torgi.gov.ru/new/public/opendata/reg"
    ],
    "adapter_id": null,
    "research": {
      "checked_at": null,
      "state": "Site/open data timeout",
      "runtime_live_verified": false,
      "provenance": "Delegated government report from task 01a13cd5-aa46-7613-9cf6-07c600d1200d. No current primary procurement card read; all leads HOLD. Named original ra_government_sources_expanded_2026-10-16.json not attached here; this preserves supplied report only.",
      "reported_evidence": "System/operator confirmed in official sources; current export not tested",
      "limitations": [
        "502/timeout/CAPTCHA/login/JS shell never imply zero procedures",
        "A lead needs primary card ID, current status, deadline/timezone and execution location",
        "Dedupe EIS notice plus lot plus version; preserve local IDs and evidenced EIS links",
        "Catalogue, plans, archives, price consultations and ad permits are not active contract procurements",
        "No account or permanent token authorized"
      ],
      "requirement": "Separate rights stream: winner pays for right, not fabrication contract. Do not mix into contractor opportunities."
    }
  }
]);
