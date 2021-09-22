let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/3e94163765975f35f7d8ec509b33c3da52661bd1.tar.gz";
    sha256 = "07sl281r29ygh54dxys1qpjvlvmnh7iv1ppf79fbki96dj9ip7d2";
  };
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
    holochainVersionId = "custom";

    holochainVersion = {
     rev = "807b27eb991dfaa0c763a6d33bb53d3fc1b15023";
     sha256 = "1mlajxnakm8gjhk61vjvbrl1wibx0nq05sfcrdixrvgvxwb02x30";
     cargoSha256 = "sha256:0bxflwmdh785c99cjgpmynd0h70a5gm40pryzzrfd9xiypr29gi7";
     bins = {
       holochain = "holochain";
       hc = "hc";
     };
    };
    holochainOtherDepsNames = ["lair-keystore"];
  };
in holonix.main
