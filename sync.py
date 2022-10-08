from filehash import FileHash
from twisted.internet import task, reactor
from twisted.internet.task import LoopingCall

import os
import jsonpickle
from datetime import datetime
import json
from os.path import exists
import io

from deepdiff import DeepDiff
from deepdiff import grep, DeepSearch
from deepdiff import DeepHash


import rich
import rich.repr
from rich.json import JSON

from modules import console


def write_manifest(data):

    manifest_path = "./files/manifest.json"

    console.print(JSON(jsonpickle.encode(data)))

    with open(manifest_path, 'w') as outfile:
        json.dump(data, outfile)


def compare_dict(data, file_dict):

    files = data["files"]

    for file, file_val in file_dict.items():
        if file not in files.items():
            data["files"][file_val.name] = file_val.__dict__

    return data


def get_manifest_data():

    manifest_path = "./files/manifest.json"

    with open(manifest_path, 'r') as json_file:

        json_data = json.load(json_file)

        console.print(f"Manifest Data in : {json_data}")

        data = json.loads(json_data)
        console.print(f"Data out: {data}")

        return data


def init_manifest():

    manifest_path = "./files/manifest.json"

    if os.path.isfile(manifest_path) and os.access(manifest_path, os.R_OK):

        console.print("File exists and is readable")

        json_data = get_manifest_data()

        data = jsonpickle.decode(json_data)

        console.print("Here is your manifest:")
        console.print(data)

        return data

    else:

        console.print("Either manifest is missing or is not readable, creating manifest")

        with open(manifest_path, "w") as json_file:

            datetime_in = datetime.now()

            start_time = datetime_in.strftime("%y%m%d-%-H:%M.%-S.%f")

            start_data = {}

            start_data["create time"] =  start_time
            start_data["files"] = {}

            start_data_out = jsonpickle.encode(start_data)

            json.dump(start_data_out, json_file)

            console.print("Wrote following initial timestamp:")

            data = get_manifest_data()

            console.print(data)

            return data

class File:

    def __init__(self, path, file_hash):

        self.name = (f"{path}-{file_hash}")

        self.path = path

        self.file_hash = file_hash

        now  = datetime.now()

        self.timestamp = now.strftime("%y%m%d-%-H:%M.%-S.%f")


    def __rich_repr__(self):

        yield "Name", self.name

        yield "Path", self.path

        yield "Hash", self.file_hash

        yield "Timestamp", self.timestamp


def compare_mans(data, to_compare):

    data = jsonpickle.encode(data)

    to_compare = jsonpickle.encode(to_compare)

    console.print("Data")
    console.print(data)
    console.print("To compare: ")
    console.print(to_compare)

    
    diff = DeepDiff(data, to_compare)

    json_diff = DeepDiff.to_json_pickle(diff)

    decoded_diff = DeepDiff.from_json_pickle(json_diff) 


    console.print("Diff: ")
    console.print(decoded_diff)
    


def main_loop(data_in):

    directory = 'files'

    file_dict = {}

    for filename in os.scandir(directory):

        if filename.is_file():

            path = filename.path

            hasher = FileHash('sha1')

            file_hash = hasher.hash_file(path)

            file = File(path, file_hash)

            file_dict[file.name] = file


    data = get_manifest_data()

    to_compare = compare_dict(data, file_dict)

    compare_mans(data_in, to_compare)

    # write_manifest(new_data)


def main():

    data_in = init_manifest()

    timeout = 1.0 # seconds

    # LoopingCall(main_loop).start(timeout)

    # reactor.run()

    main_loop(data_in)


if __name__ == "__main__":

    main()
