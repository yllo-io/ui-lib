# ui-lib
Устанавливаем node modules для тестов
```
cd tests
npm install
```
Устанавливаем node modules для либы 
```
cd package
npm install
npm link
```


Запускаем пример использования
```
cd tests
npm link @yllo/ui-lib
npm run dev
```