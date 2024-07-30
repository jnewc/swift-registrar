# swift-registrar

An implementation of the [Swift Package Registry Service](https://github.com/swiftlang/swift-package-manager/blob/main/Documentation/PackageRegistry/Registry.md) specification.

## Usage

### Running the server

```
cd server
yarn
yarn start
```

### Using packages

To use a package add it to the depdencies of your Package.swift

```
    dependencies: [
        .package(id: "my_scope.my_package_name", from: "1.2.3")
    ]
```

And then reference it in your target dependencies using the unscoped package name.

See the [official usage guide](https://github.com/swiftlang/swift-package-manager/blob/main/Documentation/PackageRegistry/PackageRegistryUsage.md) for more information.

## Config

The `registry` folder contains the files and folders that describe the packages provided by the registry.

The stucture for a release of a package is, per the [specification](https://github.com/swiftlang/swift-package-manager/blob/main/Documentation/PackageRegistry/Registry.md), represented as

```
registry/{scope}/{package}/{version}/release.json
```

each package has a list of releases at

```
registry/{scope}/{package}/releases.json
```

### Package Resolution

Currently it is only possible to resolve packages from GitHub.

The package scope is used as the account identifier, and the package name is used as the repo name.

The package version corresponds to the expected tag.

## Status

All GET endpoints except for `/identifers` is implemented. 

It is not currently possible to create releases using the PUT endpoint

## Troubleshooting

If you run into issues with your registry while building a package, you may need to delete the contents of the following cache folder

```
 ~/Library/Caches/org.swift.swiftpm
```

To ensure clean and predictable builds and rebuilds, you should also delete the `.build` and `.swiftpm` folders in your package repo.
