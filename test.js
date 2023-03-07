  db.each("SELECT client_ip AS c_ip, socket_id AS s_id, server_ip AS s_ip FROM client_list", (err, row) => {
    let client_ip = row.c_ip;
    let socket_id = row.s_id;
    let server_ip = row.s_ip;

    let clientList = {
      "server_ip": server_ip,
      "socket_id": socket_id,
      "client_ip": client_ip
    };

    if (!(JSON.stringify(manifest).includes(socket_id))) {
      console.log(`Manifest: ${JSON.stringify(manifest, null, 2)}`);

      manifest["clientList"].push(clientList);
    }
  });

  db.each("SELECT id AS id, manifest_hash AS manifest_hash, file_location AS file_location, file_name AS file_name, file_hash AS file_hash, name_hash AS name_hash, duplicate_no AS duplicate_no, last_modified AS last_modified, deleted AS deleted, recycled AS recycled, original_server_ip AS original_server_ip FROM Approved_Files", (err, row) => {
    let manifest_hash = row.manifest_hash;
    let file_location = row.file_location;
    let file_name = row.file_name;
    let file_hash = row.file_hash;
    let name_hash = row.name_hash;
    let duplicate_no = row.duplicate_no;
    let last_modified = row.last_modified;
    let deleted = row.deleted;
    let recycled = row.recycled;
    let original_server_ip = row.original_server_ip;

    let file_manifest = {
      original_server_ip: {
        name_hash: {
          "manifest_hash": manifest_hash,
          "file_location": file_location,
          "file_name": file_name,
          "file_hash":file_hash,
          "name_hash": name_hash,
          "duplicate_no": duplicate_no,
          "last_modified": last_modified,
          "deleted": deleted,
          "recycled": recycled,
          "original_server_ip": original_server_ip
        }
      }
    };

    if (!(manifest.includes(JSON.stringify(file_manifest)))) {
      manifest["Approved_Files"].original_server_ip.name_hash = file_manifest;
    };

    console.log(`Returned manifest: ${JSON.stringify(manifest, null, 2)}`);
  });

  db.close();
};