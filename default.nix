let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/3e94163765975f35f7d8ec509b33c3da52661bd1.tar.gz";
    sha256 = "07sl281r29ygh54dxys1qpjvlvmnh7iv1ppf79fbki96dj9ip7d2";
  };
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
    holochainVersionId = "custom";

    holochainVersion = {
     rev = "0d34fe7b2bfdea8b09c61d2421393ab88a74e52f";
     sha256 = "0gv619xij72h3pgm3vlmmn3v476qniici3x36yqixgi74acavj29";
     cargoSha256 = "sha256:0bxflwmdh785c99cjgpmynd0h70a5gm40pryzzrfd9xiypr29gi7";
     bins = {
       holochain = "holochain";
       hc = "hc";
     };
    };
    holochainOtherDepsNames = ["lair-keystore"];
  };
in holonix.main
