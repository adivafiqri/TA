# Tugas Akhir D4 Adiva

## Penjelasan Skenario

### Pengujian Performa

- pengujian performa terdapat pada folder JWT dan PASETO
- pengujian performa ini menggunakan Docker yang bertujuan untuk menyamakan kedua buah environment pengujian masing-masing implementasi token

Environment yang dibutuhkan:

1. POSTMAN
2. VSCODE
3. DOCKER
4. REST Client Extension (Pengganti postman sementara)


Penjelasan:
DockerFile : untuk menginstall segala keperluan image
docker-compose.yaml : untuk membuat container dan service serta perintah untuk menjalankan si node.jsnya

Tata Cara menjalankan contoh pada folder JWT:
1. ketik "sudo docker-compose -f docker-compose.yml up" (Membuat container)
- ketik "sudo docker-compose -f docker-compose.yml up -d" (-d adalah detach) (Membuat container jalan dibalik layar)
- ketik "sudo docker-compose -f docker-compose.yml up -d --build" (Membuat container jalan dibalik layar dan melihat debug cara detailnya)
- ketik "docker logs namacontainer -f" (untuk kembali melihat tanpa detach)

2. untuk melihat container yang sedang berjalan bisa "docker container ls" atau "docker container ls | grep namacontainer"

3. untuk masuk ke container bisa "docker exec -t namacontainer sh"

#### Performa JWT
1. Jalankan docker-compose
2. buka postman dan ketik localhost:4000/login POST dengan body JSON username:adiva dan password:adiva
3. muncul Execution time dan jumlah tokennya

#### Performa PASETO
1. Jalankan docker-compose
2. buka postman dan ketik localhost:8080/login POST dengan body JSON username:adiva dan password:adiva
3. muncul Execution time dan jumlah tokennya

### Pengujian keamanan

- pengujian keamanan terdapat pada folder skenario_satu, skenario_dua, skenario_tiga, skenario_empat

Environment yang dibutuhkan:

1. POSTMAN
2. VSCODE
3. REST Client Extension (Pengganti postman sementara)

#### Skenario_satu

==== 1 A =====
terdapat skenario 1A JWT, 1APASETO = skenario ini bertujuan untuk mencoba mengakses data pada aplikasi shop

- deskripsi skenario 1A:
  API Login dan akses data terdapat pada A_JWT dan A_PASETO.

- Tutorial menjalankan app:
  npm run ajwt
  npm run apaseto

- Tutorial API:
  sudah diurutkan pada skenariosatu-jwt.rest dan skenariosatu-paseto.rest

==== 1 B =====
Skenario 1B ini bertujuan untuk PATCH X-User-Id (UPDATE USER sesuai dengan IDnya)

- deskripsi skenario 1B:
  API Login dan akses data terdapat pada B_JWT dan B_PASETO.

- Tutorial menjalankan app:
  npm run bjwt
  npm run bpaseto

- Tutorial API:
  sudah diurutkan pada skenariosatu-jwt.rest dan skenariosatu-paseto.rest

#### Skenario_dua

==== 2 A =====
JWT dan PASETO melakukan eksploitasi algoritma

==== 2 B =====

JWT dan PASETO decode token

#### Skenario_tiga

JWT DAN PASETO ini tinggal ikutin skenariotiga-jwt.rest dan skenariotiga-paseto.rest

kekurangan skenario_tiga : bukan tokennya yang menutupi excesive data pada komentar, tapi koding json itu sendiri

#### Skenario_empat

Skenario ini melakukan CSRF
SKENARIONYA:
Seseorang ingin mengganti password, dan terdapat attacker yang melakukan intercept ditengah tengah

Membutuhkan APK tambahan : Burpsuite

Folder APK Burpsuite : d:\APK\burpsuite (laptop)

Settings proxy pada postman menjadi 127.0.0.1:8080

#### MONGO SHELL

cara log in mongo shell
1. mongosh "mongodb+srv://taadiva.3lgefed.mongodb.net/pengujiantoken" --apiVersion 1 --username adivafiqri
2. masukan password m7K0G0eMK7qL27ag
3. selesai


##### command mongo shell
- menampilkan db: show dbs
- menggunakan db: use <nama_database>
- menampilkan koleksi: show collectionso
- menampilkan data all koleksi:db.<nama_koleksi>.find()
- menampilkan spesifik: db.<nama_koleksi>.find({ field: value })
- Menampilkan satu dokumen dalam suatu koleksi: db.<nama_koleksi>.findOne()
- Menampilkan dokumen dengan kriteria tertentu: db.<nama_koleksi>.findOne({ field: value })

- edit dokumen: db.<nama_koleksi>.updateOne({ field: value }, { $set: { new_field: new_value } })

- edit banyak: db.<nama_koleksi>.updateMany({ field: value }, { $set: { new_field: new_value } })

- delete satu : db.<nama_koleksi>.deleteOne({ field: value })

- delete banyak : db.<nama_koleksi>.remove({})
