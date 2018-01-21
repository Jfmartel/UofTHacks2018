import os
import requests
import json

BASE_HEADERS = {
    "Origin": "https://developer.riotgames.com",
    "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36"
}

"""
"item": [
  {
"offset": 0,
"id": "3500",
"name": "American Indian/Alaska Native Foods"
},
  {
"offset": 1,
"id": "0300",
"name": "Baby Foods"
},
  {
"offset": 2,
"id": "1800",
"name": "Baked Products"
},
  {
"offset": 3,
"id": "1300",
"name": "Beef Products"
},
  {
"offset": 4,
"id": "1400",
"name": "Beverages"
},
  {
"offset": 5,
"id": "0800",
"name": "Breakfast Cereals"
},
  {
"offset": 6,
"id": "2000",
"name": "Cereal Grains and Pasta"
},
  {
"offset": 7,
"id": "0100",
"name": "Dairy and Egg Products"
},
  {
"offset": 8,
"id": "2100",
"name": "Fast Foods"
},
  {
"offset": 9,
"id": "0400",
"name": "Fats and Oils"
},
  {
"offset": 10,
"id": "1500",
"name": "Finfish and Shellfish Products"
},
  {
"offset": 11,
"id": "0900",
"name": "Fruits and Fruit Juices"
},
  {
"offset": 12,
"id": "1700",
"name": "Lamb, Veal, and Game Products"
},
  {
"offset": 13,
"id": "1600",
"name": "Legumes and Legume Products"
},
  {
"offset": 14,
"id": "2200",
"name": "Meals, Entrees, and Side Dishes"
},
  {
"offset": 15,
"id": "1200",
"name": "Nut and Seed Products"
},
  {
"offset": 16,
"id": "1000",
"name": "Pork Products"
},
  {
"offset": 17,
"id": "0500",
"name": "Poultry Products"
},
  {
"offset": 18,
"id": "3600",
"name": "Restaurant Foods"
},
  {
"offset": 19,
"id": "0700",
"name": "Sausages and Luncheon Meats"
},
  {
"offset": 20,
"id": "2500",
"name": "Snacks"
},
  {
"offset": 21,
"id": "0600",
"name": "Soups, Sauces, and Gravies"
},
  {
"offset": 22,
"id": "0200",
"name": "Spices and Herbs"
},
  {
"offset": 23,
"id": "1900",
"name": "Sweets"
},
  {
"offset": 24,
"id": "1100",
"name": "Vegetables and Vegetable Products"
}
"""

def do_magic():
    base_url = 'https://api.nal.usda.gov/ndb/search?format=json&sort=n&max=1000&api_key=vvNxeLawkFLOkRRKyJgEnJQSgZhgGXlCiAI7CPBj&fg='
    cats = ['1300','2000','0100','0400','1500','0900','0200','1700','1600','1200','1000','0500','0700','1100']
    igrd_dict = {}
    for c in cats:
        print(c)
        url = base_url + c
        req = requests.get(url, headers=BASE_HEADERS).json()
        items_set = set()
        for i in req['list']['item']:
            name_split = i['name'].split(',')
            name_split = list(map(str.strip, name_split))
            name_split = list(map(str.lower, name_split))
            if len(name_split) > 1:
                items_set.update([name_split[0],
                               name_split[0] + ' ' + name_split[1],
                               name_split[1],
                               name_split[1] + ' ' + name_split[0]])
            else:
                items_set.add(name_split[0])
        igrd_dict[c] = list(items_set)
    with open('ingredients.json', 'w') as fp:
        json.dump(igrd_dict, fp)

    return igrd_dict

if __name__=='__main__':
    [print(str(v) + '\n' )for k,v in do_magic().items()]
