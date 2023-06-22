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
