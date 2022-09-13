# Import rich

import rich
from rich.console import Console
from rich.theme import Theme
from rich.traceback import install
from rich.logging import RichHandler
from rich import pretty
from rich import print
from rich.json import JSON as JSON
from rich import print_json
import rich.repr


def main():

    pretty.install()

    install(show_locals=True)

    red = Theme({
        "1": "red",
        "info": "dim cyan",
        "warning": "magenta",
        "danger": "bold red"
    })

    console = Console(theme=red, stderr=True)
