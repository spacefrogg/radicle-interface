{
  description = "Radicle web frontend";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-23.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    ...
  }:
    {
      nixosModules.radicle-interface = { config, lib, pkgs, ... }: {
        options.services.radicle-interface.enable = lib.mkEnableOption "Local radicle web interface";
        config = lib.mkIf config.services.radicle-interface.enable {
          services.nginx = {
            enable = true;
            virtualHosts.localhost = {
              listen = [ { addr = "127.0.0.1"; port = 4433; ssl = false; } ];
              rejectSSL = true;
              locations = {
                "/" = {
                  index = "index.html";
                  root = self.packages.${pkgs.system}.radicle-interface;
                  extraConfig = ''
                    try_files $uri $uri/ /index.html;
                  '';
                };
              };
            };
          };
        };
      };
    } //

    (flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
      inherit (pkgs) lib;
    in {

      packages = {
        default = self.packages.${system}.radicle-interface;
        twemoji-assets = pkgs.fetchFromGitHub {
          owner = "twitter";
          repo = "twemoji";
          rev = "v14.0.2";
          hash = "sha256-YoOnZ5uVukzi/6bLi22Y8U5TpplPzB7ji42l+/ys5xI=";
        };

        radicle-interface = pkgs.callPackage ({
          lib, buildNpmPackage
        }: buildNpmPackage rec {
          pname = "radicle-interface";
          version = "1.0.0";
          src = ./.;
          npmDepsHash = "sha256-ILobxTiyNuQvwgKD46/5zQFnQUQA4CuosnpKMinG2Ak=";
          postPatch = ''
            patchShebangs --build ./scripts
            mkdir -p "public/twemoji"
            cp -t public/twemoji -r -- ${self.packages.${system}.twemoji-assets}/assets/svg/*
            : >scripts/install-twemoji-assets
          '';

          installPhase = ''
            runHook preInstall
            mkdir -p "$out"
            cp -r -t "$out" build/*
            runHook postInstall
          '';
        }) {};
      };
    }));
}
