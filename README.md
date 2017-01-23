[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

>  Command line tool to help you manage your Contentful spaces more efficiently.

### Examples

#### Copying fields

Often times when working on your content model, you might want to create a field on a content type that should be configured exactly like on another content type. It should have the same required, localization and validation configuration. Unfortunately, Contentful currently does not support copying fields between content types. Wouldn't it be super useful to have a *master* content type that contains pre-configured fields that you can just copy over to a new content type you're working on? Now you can.

```bash
> contentful-utils copy-fields slug title \
  --source blogPost \
  --target page \
  --config ~/Desktop/contentful-config.json
```

This will copy the fields `slug` and `title` from your content type `blogPost` to the content type `page`, using access credentials and other parameters stored inside `~/Desktop/contentful-config.json`.

#### Deleting fields

Deleting fields from a content type can be a bit tedious on Contentful. When doing this from the frontend, you have to first disable the field in the editor and in responses, save the content type, delete the field and save, again. This takes precious time, when during an exploratory phase you might not need to be this cautious. Now you can delete a field with just one command.

```bash
> contentful-utils copy-fields slug \
  --source blogPost \
  --target page \
  --config ~/Desktop/contentful-config.json
```

This will copy the field `slug` from your content type `blogPost` to the content type `page`, using access credentials and other parameters stored inside `~/Desktop/contentful-config.json`.

### Requirements

contentful-utils tracks NodeJS stable to benefit for the latest language features. However, currently Node.js `v.6.x.x` should be sufficient.

### Installation

Install globally using npm.

```npm install -g contentful-utils```

### Options

contentful-utils have a bunch of global options, for example the `space`, as well as command specific options. All configuration flags can also be provided in a `config.json` passed on to contentful-utils using the `—config` flag.

#### Global options

```bash
Usage: contentful-utils <command> [options]

Commands:
  copy-fields <fields..>    Copies <fields> from --source Content
                            Type to --target Content Type(s).
  delete-fields <fields..>  Deletes <fields> from --target Content
                            Type(s).

Options:
  --version            Show version number                 [boolean]
  --config             Configuration file with required values
  --space              ID of the Space to operate on.
                                                 [string] [required]
  --management-token   Management API token for the space.
                                                 [string] [required]
  --pre-publish-delay  Delay in milliseconds to account for delay
                       after creating entities, due to internal
                       database indexing    [number] [default: 5000]
  --host               Host for the Management API.         [string]
  --port               Port for the Management API.         [string]
  --insecure           If the Management API should use http instead
                       of the default https.
                                          [boolean] [default: false]
  --proxy-host         hostname of the proxy server         [string]
  --proxy-port         port of the proxy server             [string]
```



#### copy-fields options

```bash
contentful-utils copy-fields <fields..>

Options:
  --publish  Publish the Content Type(s) after adding fields.
                                                           [boolean]
```



#### delete-fields options

```bash
contentful-utils delete-fields <fields..>

Options:
  --force    Force deletion of non-omitted fields.
                                          [boolean] [default: false]
```

