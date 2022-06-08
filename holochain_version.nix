# This file was generated with the following command:
# update-holochain-versions --nvfetcher-dir=nix/nvfetcher --output-file=packages/holochain/versions/develop_lair_0_1.nix --bins-filter=holochain,hc,kitsune-p2p-proxy,kitsune-p2p-tx2-proxy --git-src=branch:develop --lair-version-req=~0.1
# For usage instructions please visit https://github.com/holochain/holochain-nixpkgs/#readme

{
    url = "https://github.com/holochain/holochain";
    rev = "7d5a80d0676e3a848952b9a3089c81a633739ca2";
    sha256 = "sha256-knY68R3vQpq8e0gqAM3/XGafZeRAPg/eynYWI4zGDgY=";
    cargoLock = {
        outputHashes = {
        };
    };

    binsFilter = [
        "holochain"
        "hc"
        "kitsune-p2p-proxy"
        "kitsune-p2p-tx2-proxy"
    ];


    lair = {
        url = "https://github.com/holochain/lair";
        rev = "v0.0.10";
        sha256 = "1j6ii77v2p846irq2ipq63as8h6c1swr0jdx8338kgdss1vaq468";

        binsFilter = [
            "lair-keystore"
        ];


        cargoLock = {
            outputHashes = {
            };
        };
    };
} 