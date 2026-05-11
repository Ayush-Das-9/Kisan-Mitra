from groq import Groq

client = Groq()
completion = client.chat.completions.create(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    messages=[
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": ""
          },
          {
            "type": "image_url",
            "image_url": {
              "url": IMAGE_DATA_URL
            }
          }
        ]
      },
      {
        "role": "assistant",
        "content": ""
      },
      {
        "role": "assistant",
        "content": "The image depicts a large green leaf with numerous small, light brown spots scattered across its surface. The leaf appears to be from a plant that is commonly found in tropical or subtropical regions, possibly a type of palm or corn plant.\n\n**Key Features:**\n\n* **Leaf Shape and Color:** The leaf is large and has a long, curved shape with a pointed tip. It is primarily green in color.\n* **Spots on the Leaf:** There are many small, light brown spots on the leaf's surface. These spots could be indicative of a fungal infection or another type of disease affecting the plant.\n* **Background:** The background of the image shows other leaves, suggesting that the plant is healthy and thriving in its environment.\n\n**Possible Causes of the Spots:**\n\n* Fungal infections\n* Bacterial infections\n* Insect infestations\n* Environmental stressors\n\n**Conclusion:**\nBased on the appearance of the spots and the overall health of the plant, it is likely that the leaf is affected by some type of disease or pest. Further examination and diagnosis would be necessary to determine the exact cause and appropriate treatment. \n\nHowever, the image seems to show a classic case of **corn leaf rust**. Corn leaf rust is a fungal disease caused by *Puccinia sorghi*, which affects corn plants. The symptoms include small, oval to elongated spots that are typically tan to golden brown in color. These spots often appear on the upper surface of the leaves but can also be found on the lower surface. The disease can lead to defoliation and reduce grain yield if severe. Management practices include planting resistant varieties, rotating crops, and applying fungicides when necessary."
      },
      {
        "role": "user",
        "content": ""
      }
    ],
    temperature=1,
    max_completion_tokens=1024,
    top_p=1,
    stream=True,
    stop=None
)

for chunk in completion:
    print(chunk.choices[0].delta.content or "", end="")
