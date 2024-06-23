export default {
    logo: <span>Aetheris</span>,
    project: {
        link: "https://github.com/wingleeio/aetheris",
    },
    docsRepositoryBase: "https://github.com/wingleeio/aetheris/tree/main/apps/documentation",
    useNextSeoProps() {
        return {
            titleTemplate: "%s – Aetheris",
        };
    },
    footer: {
        text: (
            <span>
                MIT {new Date().getFullYear()} ©{" "}
                <a href="https://docs.aetheris.io" target="_blank">
                    Aetheris
                </a>
                .
            </span>
        ),
    },
};
