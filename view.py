from modules import console

import json
from rich.json import JSON
import jsonpickle

manifest_path = "./files/manifest.json"

with open(manifest_path, 'r+') as json_file:

    data = json.loads(json_file)

    console.print(JSON(data))

