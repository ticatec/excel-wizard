<script lang="ts">

    import "@ticatec/uniface-element/ticatec-uniface-web.css"
    import "@ticatec/uniface-google-material-icons/google_material_icons.css"
    import "./app.css";
    import {en_resource, cn_resource} from "$lib/i18n_res";
    import i18n from "@ticatec/i18n";
    import MainPage from "./MainPage.svelte";


    i18n.languages = ['zh-CN', 'en'];
    i18n.language = 'zh-CN';
    i18n.setResource(en_resource);
    console.log(i18n)
</script>

<MainPage/>








