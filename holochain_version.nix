# This file was generated with the following command:
# update-holochain-versions --git-src=revision:holochain-0.0.165 --output-file=holochain_version.nix
# For usage instructions please visit https://github.com/holochain/holochain-nixpkgs/#readme

{
    url = "https://github.com/holochain/holochain";
    rev = "holochain-0.0.165";
    sha256 = "sha256-rjRdYLYhO8nrigCIK76eGcXOqxNZDkhrslXeiYSCZNk=";
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
        rev = "lair_keystore_api-v0.2.1";
        sha256 = "sha256-ty5gGI9XIZJwV/kZ9DUpjbR2oneJpJVsmYgHLEnV+18=";

        binsFilter = [
            "lair-keystore"
        ];


        cargoLock = {
            outputHashes = {
            };
        };
    };
}
